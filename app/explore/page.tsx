import { ServiceLanding } from "@/components/service-landing";
export const metadata={title:"Shop Lucent Print"};
export default function Page(){return <ServiceLanding eyebrow="FIND SOMETHING THAT FEELS LIKE YOU" title="Explore the shop." description="Choose a collection to see existing catalog listings. Looking for your own design? Custom orders have their own starting point." items={[
{title:"Shirts & team gear",description:"Explore catalog apparel and team-inspired designs, separate from custom order requests.",href:"/apparel",action:"Browse apparel"},
{title:"Tumblers",description:"Explore drinkware designs and available personalization options.",href:"/tumblers",action:"Browse tumblers"},
{title:"3D prints & collectibles",description:"Clickers, sensory pieces and seasonal creations from the existing shop.",href:"/shop",action:"Browse 3D prints"},
{title:"Make it custom",description:"Have an idea that isn’t in the catalog? Tell us what you want to create.",href:"/custom",action:"Explore custom orders"}
]}/>;}
