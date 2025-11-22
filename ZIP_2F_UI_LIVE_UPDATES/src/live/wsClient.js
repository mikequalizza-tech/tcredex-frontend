let socket;

export function initWS(onEvent){
  socket = new WebSocket("ws://localhost:5001");

  socket.onmessage = (msg)=>{
    const data = JSON.parse(msg.data);
    onEvent(data.eventType, data.payload, data.ts);
  };

  socket.onopen = ()=>console.log("WS connected");
  socket.onclose = ()=>console.warn("WS disconnected");
}
