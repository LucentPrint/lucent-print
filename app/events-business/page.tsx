import { ServiceLanding } from "@/components/service-landing";
export const metadata={title:"Events & Business Orders"};
export default function Page(){return <ServiceLanding eyebrow="MADE FOR YOUR PEOPLE" title="Bring everyone together." description="Celebrations, team orders and a business’s next chapter. Choose the kind of support you need and let’s work through the details." items={[
{title:"Party planning & reservations",description:"Share your occasion, theme and the planning help you need. Review the reservation service details before booking; dates require confirmation.",href:"/party-planning",action:"Explore event services"},
{title:"Team & group apparel",description:"Coordinate sizes, artwork and personalization for your team, family or group.",href:"/custom-studio#order",action:"Plan a group shirt order"},
{title:"Business & bulk orders",description:"Request business pricing, custom colors, event quantities or reseller packages.",href:"/wholesale",action:"Request a bulk quote"},
{title:"See completed projects",description:"Explore real apparel and 3D-print work to help shape your brief.",href:"/our-work",action:"Browse our work"}
]}/>;}
