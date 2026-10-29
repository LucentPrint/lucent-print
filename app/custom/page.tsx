import { ServiceLanding } from "@/components/service-landing";
export const metadata={title:"Custom Prints & Gifts"};
export default function Page(){return <ServiceLanding eyebrow="CREATE WITH LUCENT" title="Your idea. Your kind of custom." description="Custom apparel, sublimation gifts and drinkware, and 3D projects. Choose a starting point below, then share your artwork or idea, quantity and needed date. We’ll discuss the options and quote before you commit." items={[
{title:"Custom apparel",description:"Shirts for teams, families and businesses. Send your artwork or request help with a design.",href:"/custom-studio",action:"Build an apparel request"},
{title:"Sublimation gifts & drinkware",description:"Explore tumbler designs or request personalized mugs, water bottles and glass cans. Ask about artwork and product compatibility for your project.",href:"/tumblers",action:"Explore tumblers"},
{title:"3D prints & collectibles",description:"Browse clickers, sensory pieces and seasonal creations in the existing shop.",href:"/shop",action:"Browse 3D prints"},
{title:"Something different?",description:"Tell us your idea, quantity and occasion so we can discuss what’s possible.",href:"/contact",action:"Ask about your project"}
]}/>;}
