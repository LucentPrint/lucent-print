export const checkoutMode=process.env.NEXT_PUBLIC_CHECKOUT_MODE??"etsy";
export const etsyUrl=process.env.NEXT_PUBLIC_ETSY_SHOP_URL??"https://www.etsy.com/shop/LUCENTPRINT";
export const money=(v:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(v);
