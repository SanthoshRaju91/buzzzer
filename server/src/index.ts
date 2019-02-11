import express from "express";
import path from 'path';
import EventEmitter from 'events';
import bodyParser from 'body-parser';
import socket from 'socket.io';
import { Server } from "http";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/", express.static(path.resolve(__dirname, 'pages')));


const mediator = new EventEmitter();
const server = new Server(app);
const io = socket(server);

let channels = [{
  channel: 'buzz-channel-1',
  name: 'Buzz channel 1'
}, {
  channel: 'buzz-channel-2',
  name: 'Buzz channel 2'
}, {
  channel: 'buzz-channel-3',
  name: 'Buzz channel 3'
}, {
  channel: 'buzz-channel-4',
  name: 'Buzz channel 4'
}]

let stopper: any = {
  "buzz-channel-1": 0
}

let winner: any = {
  'buzz-channel-1': {}
}

let socketConnection: any = null;

mediator.on('connection', () => {
  io.on('connection', (socket) => {
    console.log(`A user connected`);    
    socketConnection = socket;

    mediator.emit('channels', socketConnection);
  })
})

mediator.on('channels', (socket) => {
  console.log(`Creating Channels`);
    channels.map(currentChannel => {
      console.log(`Setting up channel for ${currentChannel.name}`);
      socket.on(currentChannel.channel, (contestant: any) => {        
        if(!stopper[currentChannel.channel]) {
          stopper[currentChannel.channel] = 1;
          winner[currentChannel.channel] = contestant
          io.emit(currentChannel.channel, contestant)
        }         
        io.emit(currentChannel.channel, "Reset the buzzer");
      })
    })
})

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

app.post('/channel/create', (req, res) => {
  const { channel, name } = req.body;
  channels.push({
    channel,
    name
  });
  mediator.emit('channels', socketConnection);

  res.json({message: 'channel created'});
})

app.post('/channel/:id/reset', (req, res) => {
  const id = req.params.id;
  if(stopper[id]) {
    stopper[id] = 0;
  }

  res.json({
    message: 'Reset done'
  })
})

mediator.emit('connection');

server.listen(3000, () => {
  console.log(`Server listening on port 3000`);
});
