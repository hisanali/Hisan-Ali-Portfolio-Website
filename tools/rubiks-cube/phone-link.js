import {createClient} from '@supabase/supabase-js';
import QRCode from 'qrcode';
import {validFace,SCAN_FACES} from './scan-colours.js';
const TTL=20*60*1000;
export function phoneToken(){const p=new URLSearchParams(location.hash.slice(1)),t=p.get('phone');return /^[a-f0-9]{48}$/.test(t||'')?t:null;}
export async function connectPhone({token,role,onMessage,onStatus}){
 const response=await fetch('/api/multiplayer/config',{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('Phone pairing is unavailable. You can still scan on this device.');
 const config=await response.json();if(!config.url||!config.publishableKey)throw Error('Phone pairing is not configured.');
 const client=createClient(config.url,config.publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},realtime:{params:{eventsPerSecond:8}}});
 let id=crypto.randomUUID();try{const key=`cube-peer-${role}-${token}`;id=sessionStorage.getItem(key)||id;sessionStorage.setItem(key,id);}catch{}let peer=null,closed=false,connected=false,heartbeat,expiry;
 const channel=client.channel(`cube-scan-${token}`,{config:{broadcast:{ack:true,self:false}}});
 const send=async(type,payload={})=>{if(closed||!connected)throw Error('Connection lost. Wait for reconnection.');const result=await channel.send({type:'broadcast',event:'cube',payload:{type,role,id,...payload}});if(result!=='ok')throw Error('Could not send. Keep both devices open and try again.');};
 channel.on('broadcast',{event:'cube'},({payload:p})=>{
  if(closed||!p||p.role===role||!['desktop','phone'].includes(p.role)||typeof p.id!=='string'||p.id.length>64)return;
  if(peer&&peer!==p.id)return;
  if(!['hello','welcome','face','ack','target','bye'].includes(p.type))return;
  if(p.type==='face'&&(!validFace(p.face,p.colours)||typeof p.messageId!=='string'||p.messageId.length>64))return;
  if(['target','welcome'].includes(p.type)&&!SCAN_FACES.includes(p.face))return;
  if(!peer&&['hello','welcome'].includes(p.type))peer=p.id;
  if(!peer)return;
  onMessage(p,send);
 });
 // Return the connection handle immediately so the QR and cancellation never
 // wait for a WebSocket handshake. Supabase retries interrupted subscriptions.
 const connectingTimer=setTimeout(()=>{if(!closed&&!connected)onStatus('Still connecting. Scan the QR code; keep both pages open. If this continues, check your network.');},15000);
 channel.subscribe(s=>{if(closed)return;connected=s==='SUBSCRIBED';if(connected){clearTimeout(connectingTimer);onStatus('Connected to pairing service. Scan the QR code with your phone.');send('hello').catch(()=>{});}else onStatus('Connection interrupted. Reconnecting automatically — keep both pages open.');});
 heartbeat=setInterval(()=>{if(connected)send('hello').catch(()=>{});},2500);expiry=setTimeout(()=>{onStatus('This pairing link expired. Create a new QR code on your desktop.');close();},TTL);
 function close(){if(closed)return;closed=true;clearInterval(heartbeat);clearTimeout(expiry);clearTimeout(connectingTimer);client.removeChannel(channel);client.realtime.disconnect();}
 return {send,close,id};
}
export function makeToken(){return Array.from(crypto.getRandomValues(new Uint8Array(24)),n=>n.toString(16).padStart(2,'0')).join('');}
export async function drawQR(canvas,url){await QRCode.toCanvas(canvas,url,{width:240,margin:3,errorCorrectionLevel:'M',color:{dark:'#172119',light:'#ffffff'}});}
