import { ServiceLanding } from "@/components/service-landing";
export const metadata={title:"Custom Prints & Gifts"};
export default function Page(){return <ServiceLanding eyebrow="CREATE WITH LUCENT" title="Your idea. A personal touch." description="Choose an existing piece or tell us about something new. Start with what you want to make—we’ll help you find the right process." items={[
{title:"Custom apparel",description:"Shirts for teams, families and businesses. Send your artwork or request help with a design.",href:"/custom-studio",action:"Build an apparel request"},
{title:"Personalized tumblers",description:"Explore drinkware designs and personalization options, or ask about a custom piece.",href:"/tumblers",action:"Explore tumblers"},
{title:"3D prints & collectibles",description:"Browse clickers, sensory pieces and seasonal creations in the existing shop.",href:"/shop",action:"Browse 3D prints"},
{title:"Something different?",description:"Tell us your idea, quantity and occasion so we can discuss what’s possible.",href:"/contact",action:"Ask about your project"}
]}/>;}
