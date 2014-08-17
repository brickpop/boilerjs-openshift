#!/bin/env node

var fs = require('fs');
var http = require('http');
var https = require('https');
var express = require('express');
var mongoose = require('mongoose');
var api = require('./controllers/api.js');


var TemplateApp = function() {

    var self = this;

    self.setupVariables = function() {

        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;

        if (typeof self.ipaddress === "undefined") {
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };

        // FEATURES
        self.useHttp = true;
        self.useHttps = false;

        // PORTS
        self.httpPort = process.env.OPENSHIFT_NODEJS_PORT || 8080;
        self.httpsPort = process.env.OPENSHIFT_NODEJS_SSL_PORT || 8443;

        // Mongo DB
        self.dbHost = "ds063449.mongolab.com:63449";
        self.dbName = "testing";
        self.dbUser = "test";
        self.dbPassword = "test";

        // HTTP Authentication
        self.httpUser = "";
        self.httpPassword = "";

        // SSL Certificates
        self.keyFile = '/etc/pki/tls/private/localhost.key';
        self.certFile = '/etc/pki/tls/certs/localhost.crt';
    };

    // CACHE
    self.populateCache = function() {
        if (typeof self.localCache === "undefined") {
            self.localCache = { 'index.html': '' };
        }

        self.localCache['index.html'] = fs.readFileSync('./public/index.html');
    };

    self.getCached = function(key) {
        return self.localCache[key];
    };

    // LIFECYCLE
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };

    self.setupTerminationHandlers = function(){

        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };

    // SERVER
    self.createRoutes = function() {
        self.routes = {
            '/api/users': api.users,
            '/api/users/:username': api.user,
            '/api/events': api.events
        };
    };

    self.initializeServer = function() {

        self.app = express();
        self.createRoutes();

        // SERVER SETTINGS
        self.app.configure(function(){
          self.app.use(express.bodyParser());
          self.app.use(express.methodOverride());
          self.app.use(self.app.router);

          if(self.httpUser && self.httpPassword) {
              self.app.use(express.basicAuth(self.httpUser, self.password));
          }
          self.app.use(express.static('./public'));
        });

        //  Add handlers for the app
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }

        // DATABASE
        if(self.dbUser && self.dbPassword)
            mongoose.connect('mongodb://' + self.dbUser + ':' + self.dbPassword + '@' + self.dbHost + '/' + self.dbName);
        else
            mongoose.connect('mongodb://' + self.dbHost + '/' + self.dbName);

        // SSL
        if(self.useHttps) {
            var privateKey  = fs.readFileSync(self.keyFile, 'utf8');
            var certificate = fs.readFileSync(self.certFile, 'utf8');
            var credentials = {key: privateKey, cert: certificate};
        }
    };

    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();
        self.initializeServer();
    };

    self.start = function() {

        // START SERVER
        var httpServer, httpServer;
        if(self.useHttp) {
            httpServer = http.createServer(self.app);
            httpServer.listen(self.httpPort);
        }
        if(self.useHttps) {
            httpsServer = https.createServer(credentials, self.app);
            httpsServer.listen(self.httpsPort);
        }

        console.log("Server listening on ", self.ipaddress, self.useHttp ? self.httpPort : "", self.useHttps ? self.httpsPort : "");
    };

};

// MAIN
var zapp = new TemplateApp();
zapp.initialize();
zapp.start();
