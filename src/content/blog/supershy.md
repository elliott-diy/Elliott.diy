---
title: 'Supershy: Remote Code Execution in a VPN Client'
description: 'How I found a RCE vulnerability in a privacy VPN.'
pubDate: 'July 6, 2025'
tags: ['vpn', 'security', 'rce', 'research']
heroImage: './images/supershy.jpg'
heroImageAlt: 'Supershy VPN remote code execution write-up cover image'
---

## Preface

Before diving into the technical details, I want to be clear that this write-up isn’t meant to dunk on anyone. Supershy is an early-stage open-source project, and the developer responded quickly and transparently when I reported the issues. He put in a serious effort to fix them, and I have a lot of respect for that.

The Bellingcat Discord was also incredibly helpful throughout this, and it’s one of the most constructive, curious technical communities I’ve seen. This kind of collaboration is exactly how open-source security should work.

## How I Found Supershy

I came across [Supershy](https://supershy.org/) on the Bellingcat Discord, where the developer had shared a post about a new privacy-focused VPN project. It’s open source, rotates exit nodes every 30 minutes, and was being pitched as useful for journalists, activists, and researchers.

The VPN was still early-stage and had no organization backing it yet, just the dev posting updates and looking for feedback. Out of curiosity, I decided to take a quick look through the source code to see how it worked.

## Initial Review and WebSocket Usage

When I first started looking into the Supershy VPN client, the code that stood out to me the most was the VPN's use of WebSockets in the user interface. The VPN client app uses Electron for its interface and then employs WebSockets to control the underlying VPN client.

```typescript
export const start = (io: Server) => {
    io.on('connection', (socket) => {
        io.emit('/started', getConfig().APP_ENABLED);
        io.emit('/config', getConfig());
        io.emit('/node', models.getLastConnectedNode());
        socket.on('/node/enable', async () => await core.reset(io, '/node/enable', true));
        socket.on('/node/disable', async () => await core.reset(io, '/node/disable', false));
        socket.on('/config/save', async (newConfig: Config) => await core.saveConfig(io, newConfig));
    });
    serve(io.handler(), { port: getConfig().WEB_SOCKET_PORT });
};
```
The code above is part of the Supershy VPN client that handles WebSocket connections. It listens for various events, such as enabling or disabling a node and saving configuration changes. The `reset` function is called to reset the network interfaces when a node is enabled or disabled.

This caught my attention because it seemed like a potential attack vector. WebSockets are often used for real-time communication, but they can also introduce security risks if not properly secured. A few other VPNs in the past have had vulnerabilities related to WebSockets, so I wanted to see if there were any authentication mechanisms in place to protect these commands.

## CORS Misconfiguration

The WebSocket server is initialized with the following code:
```typescript
const io = new Server({ cors: { origin: '*' }});
```
This is really bad. `const io = new Server({ cors: { origin: '*' }});` basically disables origin checks on the server side, so web pages from any origin can connect from a browser and issue the same Socket.IO/WebSocket commands the UI can. This lets any attacker-controlled webpage to talk to the local client.

 
To test this, I set up a simple HTML page that connects to the WebSocket server and sends the `/node/disable` command, then fired up the VPN. To my surprise, the command worked! The VPN client immediately disconnected from the server. This alone is a significant issue in a VPN advertised for use by journalists and activists, as it could expose their real IP address and traffic. However, I wanted to see if I could do more with this vulnerability.

## Configuration Endpoint Abuse
So, I turned my attention to the `/config` and `/config/save` commands. Like the enable and disable commands, they also had no authentication. The `/config` command returns the current configuration of the VPN client, which includes sensitive information such as private keys, the list of nodes and various bits of device information. The `/config/save` command allows you to save a new configuration to the VPN client. It's used when the user requests a configuration change through the user interface or when the VPN client requests an exit server to use.

Once I saw that the `/config/save` command was not authenticated, I decided to dig into the code more to see how the configuration is used and if I could exploit it further.
## Command Injection
```typescript
export const resetNetworkInterfaces = async () => {
    const isDarwin: boolean = getConfig().PLATFORM == 'darwin';
    
    await integrations.shell.pkill('0.0.0.0/0');
    await integrations.shell.pkill(`0.0.0.0:${getConfig().PROXY_LOCAL_PORT}`);
    await integrations.shell.command(`sudo -u ${getConfig().PROCESS_USER} sudo wg-quick down ${getConfig().WIREGUARD_CONFIG_PATH} || true`);
    await integrations.shell.command(`sudo ifconfig utun0 down || true`);

    isDarwin && await integrations.shell.command(`
        services=$(networksetup -listallnetworkservices)
        while read -r service; do
            networksetup -setdnsservers "$service" empty || true
        done <<< "$services"
    `);
};
```
After digging into the code a bit more, I found the `resetNetworkInterfaces` function. This function is responsible for resetting the network interfaces when a node is enabled or disabled and is perfect to exploit, as we can control when it is called.


Specifically, the line that caught my attention was:
```typescript
await integrations.shell.command(`sudo -u ${getConfig().PROCESS_USER} sudo wg-quick down ${getConfig().WIREGUARD_CONFIG_PATH} || true`);
```
The client builds shell commands by inserting config fields (`PROCESS_USER`, `WIREGUARD_CONFIG_PATH`) directly into a shell string. That allows an attacker to inject arbitrary shell content through config values. I validated this locally (for example `PROCESS_USER="sandbox; echo 'TEST' > /tmp/test.txt"`) and the injected command executed. Whether that leads to full root on a target depends on how the service and `sudo` are configured, but if the service or the invoked `sudo` is permitted to run the command, this results in arbitrary command execution with elevated privileges.

## Proof of Concept
Since I can control the configuration through the WebSocket connection, I can send a command to the VPN client to request the current configuration and then append a malicious command to the PROCESS_USER variable. This allows me to execute arbitrary commands on the system with privileges. To showcase this, I created a simple HTML page (minified here for readability, full source is on [GitHub](https://github.com/elliott-diy/supershy-rce)) using the following code:
```javascript
function sendRCE() {
  const socket = io("http://localhost:9990");

  socket.on("connect", () => {
    socket.emit("/config"); 
  });

  socket.once("/config", (config) => {
    config.PROCESS_USER += "; echo $(whoami) > /tmp/rce_user.txt";
    socket.emit("/config/save", config);
    socket.emit("/node/enable");
    socket.disconnect();
  });
}
```

I turned this into the following website to showcase the vulnerability to the Supershy team: [research.elliott.diy/0197e1a4](https://research.elliott.diy/0197e1a4).
![https://cdn.elliott.diy/supershy.png](https://cdn.elliott.diy/supershy.png)
When the user clicks the "Send RCE" button, it connects to the WebSocket server, requests the current configuration, appends a command to the PROCESS_USER variable, and then saves the new configuration. After that, it enables and disables the node, which triggers the `resetNetworkInterfaces` function and runs the injected command on the host. Whether that gives full root on a target depends on how sudo is configured.
## Server-Side SQL Injection
After I sent this to the Supershy team, they responded promptly and resolved the issue. They added authentication to the WebSocket server and also implemented validation for configuration changes, in theory, to prevent arbitrary commands from being executed.

During this process of reviewing the new PRs, I also noticed that the server component of the Supershy VPN had an SQL injection vulnerability in several places.
```typescript

app.get('/v1/peers/wireguard/:node_uuid/:peering_key', async (c: any) => {
    logger.info('GET: /v1/peers/wireguard');

    const nodeUuid = c.req.param('node_uuid');
    const peeringKey = c.req.param('peering_key');
    const server: Server | undefined = (
        await db.query(format(`
            SELECT * FROM servers
            WHERE uuid='${nodeUuid}'
            AND peering_key='${peeringKey}'
            AND type='${ServerType.ASYNCRONOUS}';
        `))
    ).rows[0];
})
```
This pattern allows an attacker to run arbitrary SQL on the database. If an attacker could get the server to deliver crafted data to clients, that server-side issue could be chained with the client-side command injection I found and lead to remote code execution on connected clients without having the user going to a malicious link. I didn't test that chain against Supershy's actual servers, but I was able to demonstrate it in the code review and through discussing it with the developer. The developer acknowledged the issue and pushed PRs that added validation around these queries.

## Conclusion
At the end of the day, I'm just a random uni student who stumbled across a project that looked interesting and decided to take a quick peek. This wasn't a formal audit or anything. I was just curious, read through the code, and things kind of spiralled from there.

What I found ended up being pretty serious, but the whole process was surprisingly smooth. The developer was great to deal with, took everything seriously, and implemented fixes quickly. I've got a lot of respect for how he handled it with just a genuine effort to make the project better.

The same goes for the Bellingcat Discord. The folks there were super helpful and respectful through the whole thing, and it's one of the few online spaces that actually feels supportive when you're digging into this kind of stuff.

I'm not saying Supershy is fully secure now or giving it some seal of approval, just sharing what I found and how it got fixed. Hopefully, it helps someone out there!
## Disclosure Timeline

* **June 23, 2025** — Reported the RCE vulnerability privately to the Supershy developer. Also notified moderators of the Bellingcat Discord to temporarily remove the announcement post.
 
  * **June 24, 2025** — Developer acknowledged the report and implemented an initial patch for the RCE.
 
  * **June 30, 2025** — Additional hardening applied. WebSocket authentication was added and input validation was improved.
 
  * **July 2, 2025** — SQL injection vulnerabilities in the server were addressed and patched.

  * **July 3, 2025** — A new release of the Supershy client was published. The disclosure was made public in the Bellingcat Discord, along with notes on the fixes.
