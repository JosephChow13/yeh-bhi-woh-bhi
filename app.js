const express = require("express");
const httpProxy = require('http-proxy');

const app = express();

app.get("/ping", (req, res) => res.send("pong"));

const handler = proxyHandler(["http://thumbor-stg.assettype.com", "http://thumbor.assettype.com"]);
app.get("/*", handler);
app.options("/*", handler);
app.head("/*", handler);

module.exports = app;

function proxyHandler(hosts) {
  const proxyHandler = hosts.reduce((nextHandler, host) => {
    const proxy = httpProxy.createServer({target: host, changeOrigin: true});

    proxy.on("proxyRes", (proxyRes, req, res) => {
      if(nextHandler && proxyRes.statusCode != 200 && proxyRes.statusCode != 304) {
        console.log("Retry", proxyRes.statusCode);
        nextHandler.web(req, wrapResponse(res.originalRes));
      } else {
        res.enableOutput();
        res.setHeader("X-YBWB-Host", host);
      }
    })

    return proxy;
  }, null);

  return (req, res) => proxyHandler.web(req, wrapResponse(res))
}


const PROXY_HANDLER = {
  get: function(target, prop, reciever) {
    if(prop == 'enableOutput')
      return () => target.enabled = true;

    if(prop == 'originalRes')
      return target.res;

    const result = target.res[prop];
    if(typeof result == 'function')
      return target.enabled ? result.bind(target.res) : () => {}
    else
      return result;
  }
}

function wrapResponse(res) {
  return new Proxy({enabled: false, res: res}, PROXY_HANDLER);
}
