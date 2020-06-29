var $ = require("$");
var msToTimeString = require("Converter").msToTimeString;
var WeakMap = require("weak-map");
var PRIVATE = new WeakMap();
var EventEmitter = require("events");
var PahoMQTT = require("paho-mqtt");

var eventNames = [
    "beforeunload",
    "unload",
    "click"
];

var client;
var clientId = getRandomInt(0,100);
// var location = {hostname: "0.0.0.0", port:9001};
var location = {hostname: "cloudsync.virt.ch.bbc.co.uk"};


function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

var initMQTTClient = function(location) {

  console.log(location);
  // Create a client instance
  client = new PahoMQTT.Client(location.hostname, undefined, clientId.toString());

  // set callback handlers
  client.onConnectionLost = onConnectionLost;
  client.onMessageArrived = onMessageArrived;

  // connect the client
  client.connect({onSuccess:onConnect, onFailure: onConnectionFailure});

}

/**
   * Monkey patch console.log and friends to redirect their output to an
   * on-screen div.
   */
  function console_log() {
    out = "\n";
    for (var i = 0; i < arguments.length; i++) {
        if (i > 0) {
            out += " ";
        }
        if (typeof(arguments[i]) == "string") {
            out += arguments[i];
        } else {
            try {
                json = JSON.stringify(arguments[i]);
                if (json === undefined) {
                    out += arguments[i];
                } else {
                    out += json;
                }
            } catch (e) {
                out += arguments[i];
            }
        }
    }
 
    var console = document.getElementById("console");
    console.textContent += out;
    console.scrollTop = console.scrollHeight;
 }
 console.log = console_log;
 console.info = console.log;
 console.error = console.log;


// called when the client connects
function onConnect() {
    // Once a connection has been made, make a subscription and send a message.
    console.log("onConnect");
    client.subscribe("Sessions/session1");
    message = new Paho.MQTT.Message(clientId + ": Hello");
    message.destinationName = "Sessions/session1";
    client.send(message);
  }
  
  // called when the client loses its connection
  function onConnectionFailure(responseObject) {
    if (responseObject.errorCode !== 0) {
      console.log("onConnectionFailure:"+responseObject.errorMessage);
    }
  }
  
  // called when the client loses its connection
  function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
      console.log("onConnectionLost:"+responseObject.errorMessage);
    }
  }
  
  // called when a message arrives
  function onMessageArrived(message) {
    console.log("onMessageArrived:"+message.payloadString);
  }

  


window.addEventListener("load", init);

function init () { 
    
    initMQTTClient(location);  // url of mqtt server endpoint

    setEventListeners(window, eventNames);
    initCountersForEvents(eventNames);
    drawEventCallCount();
    $("#btn-clear-memory").on("click", clearEventMemory);
}

function setEventListeners (object, eventNames) {
    eventNames.forEach(function (eventName) {
        setEventListener(object, eventName);
    });
}

function setEventListener (object, eventName) {    
    $(object).on(eventName, countEventCall);
}

function initCountersForEvents (eventNames) {
    eventNames.forEach(function (eventName) {
        initCounterForEvent(eventName);
    });
}

function initCounterForEvent (eventName) {
    if (localStorage.getItem(eventName) === null) {
        localStorage.setItem(eventName, JSON.stringify(new CountValue()));
    }
}

function countEventCall (event) {
    var count = parseInt(JSON.parse(localStorage.getItem(event.type)).count, 10);
    localStorage.setItem(event.type, JSON.stringify(new CountValue(count+1, Date.now())));
    drawEventCallCount();
}

function clearEventMemory (evt) {
    localStorage.clear();
    initCountersForEvents(eventNames);
    drawEventCallCount();
    evt.stopPropagation();
}

function drawEventCallCount () {
    var i = 0, key, value, table, container;
    table = new Table("Event name", "Call count", "Last called");
    
    for (; i < localStorage.length; i++) {
        key = localStorage.key(i);
        value = JSON.parse(localStorage.getItem(key));
        table.addRow(key, value.count, msToTimeString(value.date) || "never");
    }

    container = $("#results");
    if (container.children.length > 0) {
        container.replaceChild(table.node, container.lastChild);
    } else {
        container.appendChild(table.node);
    }
}

var CountValue = function (cVal, dVal) {
    this.count = cVal || 0;
    this.date = dVal || 0;
}

var Table = function (name1, name2, name3) {
    var priv;

    PRIVATE.set(this, {
        table: null
    });

    this.node = document.createElement("div");
    this.node.className = "pure-u-1";

    priv = PRIVATE.get(this);
    priv.table = document.createElement("table");
    priv.table.className = "pure-table pure-table-bordered";
    priv.table.innerHTML = '' +
        '<thead>' +
            '<tr>' +
                '<th>' + name1 + '</th>' +
                '<th>' + name2 + '</th>' +
                '<th>' + name3 + '</th>' +
            '</tr>' +
        '</thead>';

    priv.table.body = document.createElement("tbody");
    priv.table.appendChild(priv.table.body);
    this.node.appendChild(priv.table);
};

Table.prototype.addRow = function (key, value, date) {
    PRIVATE.get(this).table.body.innerHTML += '' +
        '<tr>' +
            '<td>' + key + '</td>' +
            '<td>' + value + '</td>' +
            '<td>' + date + '</td>' +
        '</tr>';
}