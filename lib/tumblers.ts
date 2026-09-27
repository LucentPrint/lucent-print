export const TUMBLERS = [
  {
    slug: "happy-halloween",
    name: "Happy Halloween Tumbler",
    image: "/images/tumblers/happy-halloween.png",
    description: "Orange Halloween artwork with bats, a glowing moon, jack-o’-lanterns and a spooky cemetery scene.",
    alt: "Orange Happy Halloween tumbler with bats, pumpkins and a black handle lid",
  },
  {
    slug: "inspirada-halloween",
    name: "Inspirada Bulldogs Halloween Tumbler",
    image: "/images/tumblers/inspirada-halloween.png",
    description: "A Halloween bulldog in a witch hat, paired with pumpkin artwork and bold green Inspirada Bulldogs lettering.",
    alt: "Orange and green Inspirada Bulldogs Halloween tumbler with a bulldog and pumpkin",
  },
  {
    slug: "autumn-pumpkin",
    name: "Autumn Pumpkin Tumbler",
    image: "/images/tumblers/autumn-pumpkin.png",
    description: "Warm orange pumpkins, autumn leaves and curling vines wrap around this seasonal design.",
    alt: "Autumn pumpkin tumbler with orange pumpkins, fall leaves and a black lid",
  },
] as const;

export function tumblerInquiry(name: string) {
  const subject = `Tumbler order request: ${name}`;
  const body = `Hi Lu, I would like to request the ${name}.\n\nQuantity: \nPreferred size: \nPersonalization (if any): \nPickup or shipping: \nNeeded by: \n\nPlease confirm available options and pricing.`;
  return `mailto:lu@lucentprintlic.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
