import prisma from "./lib/prisma";

async function main() {
  console.log("Seeding rich collaborative trip with Pillar 1 & 2 data...");

  const owner = await prisma.user.findFirst({
    where: { email: "boobalan111@gmail.com" },
  });
  if (!owner) throw new Error("Owner user not found");

  const friend1 = await prisma.user.findFirst({
    where: { email: "vigneshtharani7@gmail.com" },
  });
  const friend2 = await prisma.user.findFirst({
    where: { email: "harikarthick2506@gmail.com" },
  });
  const pendingUser = await prisma.user.findFirst({
    where: { email: "test@example.com" },
  });

  // Create or clean up sample trip
  const existing = await prisma.itinerary.findFirst({
    where: { title: "Kyoto & Tokyo Autumn Discovery" },
  });
  if (existing) {
    await prisma.itinerary.delete({ where: { id: existing.id } });
  }

  const trip = await prisma.itinerary.create({
    data: {
      userId: owner.id,
      title: "Kyoto & Tokyo Autumn Discovery",
      destination: "Kyoto, Japan",
      duration: 3,
      budgetAmount: 1800,
      startDate: new Date("2026-10-15"),
      endDate: new Date("2026-10-18"),
      tags: ["autumn", "japan", "temples", "foodie", "culture"],
      coverImage: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop",
      description: "A magical autumn escape through traditional Kyoto tea districts and futuristic Tokyo nightscapes.",
      visibility: "SHARED",
      shareToken: "kyoto-tokyo-shared-2026",
      days: {
        create: [
          {
            dayNumber: 1,
            title: "Historic Temples & Gion Lanterns",
            theme: "Cultural Immersion",
            date: new Date("2026-10-15"),
            activities: {
              create: [
                {
                  title: "Fushimi Inari Shrine Sunrise Walk",
                  description: "Hike up the mountain through 10,000 vermilion Torii gates before the crowds arrive.",
                  time: "07:30 AM",
                  type: "SIGHTSEEING",
                  cost: 0,
                  duration: 120,
                  position: 0,
                  locationName: "Fushimi Inari Taisha",
                  locationLat: 34.9671,
                  locationLng: 135.7727,
                  address: "68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto",
                },
                {
                  title: "Matcha Tasting at Uji Pavilion",
                  description: "Authentic ceremonial matcha whisking workshop and seasonal chestnut wagashi sweets.",
                  time: "11:00 AM",
                  type: "FOOD_DRINK",
                  cost: 25,
                  duration: 90,
                  position: 1,
                  locationName: "Gion Tea Master House",
                  locationLat: 35.0037,
                  locationLng: 135.7772,
                  address: "Gion Higashiyama, Kyoto",
                },
                {
                  title: "Kiyomizu-dera Sunset Terrace",
                  description: "Stunning cliffside wooden temple overlook overlooking autumn maple foliage.",
                  time: "04:30 PM",
                  type: "SIGHTSEEING",
                  cost: 5,
                  duration: 120,
                  position: 2,
                  locationName: "Kiyomizu-dera",
                  locationLat: 34.9949,
                  locationLng: 135.7850,
                  address: "1 Chome-294 Kiyomizu, Higashiyama Ward, Kyoto",
                },
                {
                  title: "Kaiseki Dinner in Pontocho Alley",
                  description: "Traditional 9-course seasonal banquet overlooking the Kamogawa River.",
                  time: "07:30 PM",
                  type: "RESTAURANT",
                  cost: 95,
                  duration: 150,
                  position: 3,
                  locationName: "Pontocho Dining Room",
                  locationLat: 35.0061,
                  locationLng: 135.7713,
                  address: "Pontocho Dori, Nakagyo Ward, Kyoto",
                },
              ],
            },
          },
          {
            dayNumber: 2,
            title: "Arashiyama Bamboo & Golden Pavilion",
            theme: "Zen Nature & Serenity",
            date: new Date("2026-10-16"),
            activities: {
              create: [
                {
                  title: "Arashiyama Bamboo Forest & Tenryu-ji",
                  description: "Morning stroll under towering bamboo stalks and world heritage Zen gardens.",
                  time: "08:30 AM",
                  type: "SIGHTSEEING",
                  cost: 10,
                  duration: 150,
                  position: 0,
                  locationName: "Arashiyama Bamboo Grove",
                  locationLat: 35.0170,
                  locationLng: 135.6713,
                  address: "Sagaogurayama Tabuchiyamacho, Ukyo Ward, Kyoto",
                },
                {
                  title: "Kinkaku-ji (Golden Pavilion)",
                  description: "Gilded Zen Buddhist temple reflecting over the serene Mirror Pond.",
                  time: "01:30 PM",
                  type: "SIGHTSEEING",
                  cost: 8,
                  duration: 90,
                  position: 1,
                  locationName: "Kinkaku-ji",
                  locationLat: 35.0394,
                  locationLng: 135.7292,
                  address: "1 Kinkakujicho, Kita Ward, Kyoto",
                },
                {
                  title: "Gion Evening Geisha District Stroll",
                  description: "Atmospheric cobblestone lanes with traditional wooden ochaya teahouses.",
                  time: "06:30 PM",
                  type: "ENTERTAINMENT",
                  cost: 0,
                  duration: 120,
                  position: 2,
                  locationName: "Gion District",
                  locationLat: 35.0037,
                  locationLng: 135.7772,
                  address: "Higashiyama Ward, Kyoto",
                },
              ],
            },
          },
          {
            dayNumber: 3,
            title: "Bullet Train to Tokyo & Shinjuku Lights",
            theme: "Modern Metropolis",
            date: new Date("2026-10-17"),
            activities: {
              create: [
                {
                  title: "Shinkansen Nozomi Bullet Train to Tokyo",
                  description: "High speed train ride (285 km/h) with clear views of Mount Fuji on the left side.",
                  time: "09:00 AM",
                  type: "TRANSPORTATION",
                  cost: 130,
                  duration: 140,
                  position: 0,
                  locationName: "Kyoto Station Shinkansen Track 12",
                  locationLat: 34.9858,
                  locationLng: 135.7588,
                  address: "Higashishiokoji Kamadonocho, Shimogyo Ward, Kyoto",
                },
                {
                  title: "Shibuya Sky Observation Deck",
                  description: "360-degree open-air rooftop observatory overlooking Shibuya Scramble crossing.",
                  time: "03:00 PM",
                  type: "SIGHTSEEING",
                  cost: 20,
                  duration: 90,
                  position: 1,
                  locationName: "Shibuya Sky",
                  locationLat: 35.6580,
                  locationLng: 139.7016,
                  address: "2 Chome-24-12 Shibuya, Tokyo",
                },
                {
                  title: "Omoide Yokocho Yakitori Alley",
                  description: "Nostalgic smoky lantern alley serving grilled chicken skewers and cold craft beers.",
                  time: "07:30 PM",
                  type: "RESTAURANT",
                  cost: 40,
                  duration: 120,
                  position: 2,
                  locationName: "Omoide Yokocho",
                  locationLat: 35.6931,
                  locationLng: 139.6998,
                  address: "1 Chome-2 Nishishinjuku, Shinjuku City, Tokyo",
                },
              ],
            },
          },
        ],
      },
    },
    include: {
      days: {
        include: { activities: true },
      },
    },
  });

  console.log(`Created trip: ${trip.id}`);

  // Add collaborators
  if (friend1) {
    await prisma.itineraryCollaborator.create({
      data: {
        itineraryId: trip.id,
        userId: friend1.id,
        role: "TRAVELER",
        inviteStatus: "ACCEPTED",
      },
    });
  }

  if (friend2) {
    await prisma.itineraryCollaborator.create({
      data: {
        itineraryId: trip.id,
        userId: friend2.id,
        role: "EDITOR",
        inviteStatus: "ACCEPTED",
      },
    });
  }

  if (pendingUser) {
    await prisma.itineraryCollaborator.create({
      data: {
        itineraryId: trip.id,
        userId: pendingUser.id,
        role: "VIEWER",
        inviteStatus: "PENDING",
      },
    });
    // Create pending invite notification for pending user
    await prisma.notification.create({
      data: {
        userId: pendingUser.id,
        type: "TRIP_INVITE",
        title: "New Trip Invitation",
        message: `${owner.name} invited you to collaborate on "${trip.title}" as a Viewer.`,
        data: {
          tripId: trip.id,
          tripTitle: trip.title,
          invitedBy: owner.name,
          role: "VIEWER",
        },
      },
    });
  }

  // 1.5 Group Voting Tools: Add 2 Group Polls
  const poll1 = await prisma.poll.create({
    data: {
      itineraryId: trip.id,
      creatorId: owner.id,
      title: "Day 2 Dinner: Best Kyoto Food Experience?",
      description: "Let's vote on our signature group dinner spot in Kyoto!",
      category: "food",
      voteType: "thumbs",
      status: "active",
      options: {
        create: [
          {
            title: "Gion Duck Noodles",
            description: "Famous ramen in a cozy hidden alley with rich duck broth and soba noodles.",
          },
          {
            title: "Kichi Kichi Omurice",
            description: "Legendary theatrical chef Motokichi fluffy egg omurice performance.",
          },
          {
            title: "Pontocho Riverside Yuka Kaiseki",
            description: "Open-air wooden deck dining overlooking the Kamogawa river.",
          },
        ],
      },
    },
    include: { options: true },
  });

  // Cast sample votes on poll1
  const omuriceOpt = poll1.options.find((o) => o.title.includes("Omurice"))!;
  const duckOpt = poll1.options.find((o) => o.title.includes("Duck"))!;

  await prisma.pollVote.createMany({
    data: [
      { pollId: poll1.id, optionId: omuriceOpt.id, userId: owner.id, value: 1 },
      { pollId: poll1.id, optionId: omuriceOpt.id, userId: friend1?.id || owner.id, value: 1 },
      { pollId: poll1.id, optionId: duckOpt.id, userId: friend2?.id || owner.id, value: 1 },
    ],
  });

  // Poll 2 linked to an activity slot
  const day3FirstAct = trip.days[2].activities[0];
  const poll2 = await prisma.poll.create({
    data: {
      itineraryId: trip.id,
      creatorId: owner.id,
      title: "Transport: Shinkansen vs Scenic Flight?",
      description: "How should we travel between Kyoto and Tokyo?",
      category: "transport",
      voteType: "ranked",
      status: "closed",
      linkedActivityId: day3FirstAct?.id,
      options: {
        create: [
          {
            title: "Nozomi Shinkansen Bullet Train",
            description: "2h 15m smooth ride with Mt. Fuji views and bento boxes.",
          },
          {
            title: "Domestic Flight via Itami Airport",
            description: "1h 10m flight into Haneda Tokyo.",
          },
        ],
      },
    },
    include: { options: true },
  });

  const shinkansenOpt = poll2.options.find((o) => o.title.includes("Shinkansen"))!;
  await prisma.poll.update({
    where: { id: poll2.id },
    data: { winnerOptionId: shinkansenOpt.id },
  });

  // 1.2 Threaded Comments: Activities & Day
  const fushimiAct = trip.days[0].activities[0];
  const c1 = await prisma.comment.create({
    data: {
      itineraryId: trip.id,
      anchorType: "activity",
      anchorId: fushimiAct.id,
      userId: friend1?.id || owner.id,
      text: "I strongly recommend we reach by 7:15 AM! The morning mist through the Torii gates is unbelievable for photos ⛩️📸",
    },
  });

  await prisma.comment.create({
    data: {
      itineraryId: trip.id,
      anchorType: "activity",
      anchorId: fushimiAct.id,
      userId: owner.id,
      parentId: c1.id,
      text: "Agreed! Setting my alarm for 6:30 AM. Coffee at the station first!",
    },
  });

  // Reaction on comment
  await prisma.commentReaction.create({
    data: {
      commentId: c1.id,
      userId: owner.id,
      emoji: "🔥",
    },
  });

  // Day comment
  await prisma.comment.create({
    data: {
      itineraryId: trip.id,
      anchorType: "day",
      anchorId: trip.days[0].id,
      userId: friend2?.id || owner.id,
      text: "Day 1 itinerary looks stacked! Let's make sure our comfortable walking shoes are packed.",
    },
  });

  // Pillar 2: Post-Trip Memory Journals
  await prisma.journalEntry.createMany({
    data: [
      {
        itineraryId: trip.id,
        authorId: owner.id,
        dayNumber: 1,
        date: new Date("2026-10-15"),
        title: "Golden Hour through Ten Thousand Torii Gates",
        notes: "We started walking up Mount Inari just as the autumn sun broke through the cedars. The vermilion pillars seemed to glow with warmth. We found a small shrine at the summit with hot green tea and fox amulets.",
        mood: "Nostalgic & Spiritual",
        locationName: "Fushimi Inari Mount Summit",
        locationLat: 34.9671,
        locationLng: 135.7727,
        photos: [
          "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1000&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1000&auto=format&fit=crop",
        ],
      },
      {
        itineraryId: trip.id,
        authorId: friend1?.id || owner.id,
        dayNumber: 2,
        date: new Date("2026-10-16"),
        title: "Whispering Stalks of Arashiyama",
        notes: "The wind through the bamboo stalks creates the famous Japanese 'sound of Japan'. We stopped by an 80-year-old tea vendor for matcha soft serve with warabi mochi.",
        mood: "Peaceful & Adventurous",
        locationName: "Arashiyama Bamboo Grove",
        locationLat: 35.0170,
        locationLng: 135.6713,
        photos: [
          "https://images.unsplash.com/photo-1528164344705-475426879c0d?q=80&w=1000&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?q=80&w=1000&auto=format&fit=crop",
        ],
      },
      {
        itineraryId: trip.id,
        authorId: owner.id,
        dayNumber: 3,
        date: new Date("2026-10-17"),
        title: "Tokyo Neon Horizons from Shibuya Sky",
        notes: "Standing on the glass floor at 230 meters above Shibuya Scramble. The city stretches endlessly to the horizon with the snowcap of Mount Fuji silhouetted against a lavender twilight sky.",
        mood: "Electrifying & Exhilarating",
        locationName: "Shibuya Sky Observatory",
        locationLat: 35.6580,
        locationLng: 139.7016,
        photos: [
          "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1000&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=1000&auto=format&fit=crop",
        ],
      },
    ],
  });

  // 2.1 Nostalgic Trip Summary
  await prisma.tripSummary.create({
    data: {
      itineraryId: trip.id,
      narrative:
        "Over three unforgettable autumn days, our group traversed from the contemplative serenity of Kyoto's vermilion mountain paths to the electric crescendo of Tokyo's neon skyline. We shared dawn walks under misty Torii gates, whispered through towering bamboo groves, indulged in world-class Kaiseki banquets, and watched twilight drape across Shibuya Crossing from 200 meters in the sky. It was a journey of laughter, discovery, and unforgettable shared memories.",
      highlights: [
        "Sunrise hike through 10,000 Torii gates at Fushimi Inari without the crowds",
        "Tasting hot ceremonial matcha and chestnut wagashi in an authentic Gion teahouse",
        "Riding the Nozomi bullet train past a snow-capped Mount Fuji at 285 km/h",
        "Sunset over Tokyo from Shibuya Sky rooftop deck",
      ],
      tone: "sentimental",
      stats: {
        totalDays: 3,
        placesVisited: 10,
        distanceTraveledKm: 512,
        photosTaken: 142,
      },
    },
  });

  // 2.4 Shareable Memory Book
  await prisma.memoryBook.create({
    data: {
      itineraryId: trip.id,
      authorId: owner.id,
      title: "Autumn Reverie: Kyoto & Tokyo 2026",
      subtitle: "A collaborative photographic journey with friends",
      layoutTemplate: "magazine",
      visibility: "public",
      shareToken: "kyoto-autumn-2026",
      coverPhoto: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop",
      customCaptions: {
        "0": "Golden hour through the sacred gates of Mount Inari",
        "1": "Morning calm within the bamboo forest of Sagano",
        "2": "Tokyo after dark: infinite lights from above",
      },
    },
  });

  // Activity logs for Version History Drawer
  await prisma.activityLog.createMany({
    data: [
      {
        itineraryId: trip.id,
        userId: owner.id,
        action: "CREATED",
        entityType: "TRIP",
        summary: `${owner.name} created trip "Kyoto & Tokyo Autumn Discovery"`,
      },
      {
        itineraryId: trip.id,
        userId: owner.id,
        action: "INVITED",
        entityType: "COLLABORATOR",
        summary: `${owner.name} invited ${friend1?.name} as Traveler`,
      },
      {
        itineraryId: trip.id,
        userId: friend1?.id || owner.id,
        action: "COMMENTED",
        entityType: "ACTIVITY",
        summary: `${friend1?.name || "Tharani"} commented on Fushimi Inari Sunrise Walk`,
      },
      {
        itineraryId: trip.id,
        userId: owner.id,
        action: "CREATED",
        entityType: "POLL",
        summary: `${owner.name} launched poll "Best Kyoto Food Experience?"`,
      },
    ],
  });

  console.log("Seeding complete! Sample trip ID:", trip.id);
  console.log("Memory book share token: kyoto-autumn-2026");
}

main()
  .catch((e) => {
    console.error("Error seeding:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
