import { prisma } from './lib/prisma'; async function main() { const itineraries = await prisma.itinerary.findMany(); console.log(JSON.stringify(itineraries, null, 2)); } main();
