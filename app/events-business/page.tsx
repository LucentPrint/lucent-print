import { ServiceLanding } from "@/components/service-landing";
export const metadata={title:"Events & Business Orders"};
export default function Page(){return <ServiceLanding eyebrow="MADE FOR YOUR PEOPLE" title="Creative work for your people." description="Party planning and reservation services, coordinated group apparel, and business or bulk orders. Choose the service you need, then share your event date, quantity and project details." items={[
{title:"Party planning & reservations",description:"Start with your celebration, theme and planning needs. For the paid reservation booking service, review what you’re purchasing before checkout. Payment does not automatically confirm your date.",href:"/party-planning",action:"Explore event services"},
{title:"Team & group apparel",description:"Coordinate sizes, artwork and personalization for your team, family or group.",href:"/custom-studio#order",action:"Plan a group shirt order"},
{title:"Business & bulk orders",description:"Request business pricing, custom colors, event quantities or reseller packages.",href:"/wholesale",action:"Request a bulk quote"},
{title:"See completed projects",description:"Explore real apparel and 3D-print work to help shape your brief.",href:"/our-work",action:"Browse our work"}
]}/>;}
