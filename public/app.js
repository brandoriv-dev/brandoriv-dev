const base = document.querySelector("base") ?? document.createElement("base");
base.href = "/moss/";
if (!base.isConnected) document.head.prepend(base);

await import("/moss/app.js");
