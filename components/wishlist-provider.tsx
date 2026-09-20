"use client";
import {createContext,useContext,useEffect,useMemo,useState} from "react";
import type {Product} from "@/lib/types";
type W={items:Product[];toggle:(p:Product)=>void;has:(id:string)=>boolean;count:number};
const C=createContext<W|null>(null);
export function WishlistProvider({children}:{children:React.ReactNode}){const[items,setItems]=useState<Product[]>([]);useEffect(()=>{try{setItems(JSON.parse(localStorage.getItem("lucent-wishlist")||"[]"))}catch{}},[]);useEffect(()=>{localStorage.setItem("lucent-wishlist",JSON.stringify(items))},[items]);const value=useMemo(()=>({items,toggle:(p:Product)=>setItems(x=>x.some(i=>i.id===p.id)?x.filter(i=>i.id!==p.id):[...x,p]),has:(id:string)=>items.some(i=>i.id===id),count:items.length}),[items]);return <C.Provider value={value}>{children}</C.Provider>};
export function useWishlist(){const c=useContext(C);if(!c)throw new Error("WishlistProvider missing");return c;}
