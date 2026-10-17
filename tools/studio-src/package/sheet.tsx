"use client";
import {FeatureTrainingBadge} from "./feature-training";
import {useEffect,useRef,type ReactNode} from "react";
import {createPortal} from "react-dom";
import {X} from "lucide-react";

// Bottom sheet on phones, centred dialog on larger screens.
export default function Sheet({label,onClose,busy=false,className,children,feature,closeLabel="Close"}:{label:string;onClose:()=>void;busy?:boolean;className:string;children:ReactNode;feature?:string;closeLabel?:string}){
 const box=useRef<HTMLElement>(null);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==="Escape"&&!busy)onClose();};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);},[busy,onClose]);
 // Same as the app's other dialogs: the page behind stops scrolling and focus returns afterwards.
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null,content=document.querySelector<HTMLElement>(".main-content"),oldBody=document.body.style.overflow,oldContent=content?.style.overflowY||"";
  document.body.style.overflow="hidden";if(content)content.style.overflowY="hidden";
  if(!box.current?.contains(document.activeElement))box.current?.querySelector<HTMLElement>("input,button")?.focus({preventScroll:true});
  return()=>{document.body.style.overflow=oldBody;if(content)content.style.overflowY=oldContent;previous?.focus({preventScroll:true});};
 },[]);
 // Rendered on <body> so the page's entrance animation cannot trap it under the tab bar.
 return createPortal(<div className="modal-backdrop" role="presentation" onMouseDown={()=>!busy&&onClose()}><section ref={box} className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={label} onMouseDown={e=>e.stopPropagation()}><button className="modal-close" onClick={onClose} aria-label={closeLabel} disabled={busy}><X/></button><FeatureTrainingBadge feature={feature} label={label}/>{children}</section></div>,document.body);
}
