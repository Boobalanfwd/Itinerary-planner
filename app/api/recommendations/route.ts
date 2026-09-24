import { NextRequest, NextResponse } from "next/server";

interface Recommendation {
  id: string;
  title: string;
  destination: string;
  duration: string;
  budget: string;
  image: string;
  tags: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { destination, tags } = await request.json();

    // Comprehensive recommendation database
    const allRecommendations: Recommendation[] = [
      {
        id: "1",
        title: "Cultural Heritage Tour",
        destination: "Kyoto, Japan",
        duration: "5 Days",
        budget: "$2000",
        image:
          "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800",
        tags: ["Culture", "History", "Food", "Temples"],
      },
      {
        id: "2",
        title: "Mediterranean Adventure",
        destination: "Santorini, Greece",
        duration: "7 Days",
        budget: "$2500",
        image:
          "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800",
        tags: ["Beach", "Romance", "Luxury", "Sunset"],
      },
      {
        id: "3",
        title: "Urban Explorer",
        destination: "New York, USA",
        duration: "4 Days",
        budget: "$1800",
        image:
          "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800",
        tags: ["City", "Shopping", "Food", "Museums"],
      },
      {
        id: "4",
        title: "Alpine Adventure",
        destination: "Swiss Alps",
        duration: "6 Days",
        budget: "$3000",
        image:
          "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800",
        tags: ["Adventure", "Nature", "Hiking", "Luxury"],
      },
      {
        id: "5",
        title: "Tropical Paradise",
        destination: "Bali, Indonesia",
        duration: "8 Days",
        budget: "$1500",
        image:
          "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800",
        tags: ["Beach", "Culture", "Wellness", "Budget"],
      },
      {
        id: "6",
        title: "Historic Journey",
        destination: "Rome, Italy",
        duration: "5 Days",
        budget: "$2200",
        image:
          "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800",
        tags: ["History", "Food", "Art", "Culture"],
      },
      {
        id: "7",
        title: "Desert Safari",
        destination: "Dubai, UAE",
        duration: "4 Days",
        budget: "$2800",
        image:
          "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800",
        tags: ["Luxury", "Shopping", "Adventure", "Modern"],
      },
      {
        id: "8",
        title: "Island Hopping",
        destination: "Thailand",
        duration: "10 Days",
        budget: "$1800",
        image:
          "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800",
        tags: ["Beach", "Adventure", "Food", "Budget"],
      },
      {
        id: "9",
        title: "Northern Lights",
        destination: "Iceland",
        duration: "6 Days",
        budget: "$3500",
        image:
          "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800",
        tags: ["Nature", "Adventure", "Photography", "Unique"],
      },
      {
        id: "10",
        title: "Safari Experience",
        destination: "Kenya",
        duration: "7 Days",
        budget: "$4000",
        image:
          "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800",
        tags: ["Wildlife", "Adventure", "Nature", "Luxury"],
      },
      {
        id: "11",
        title: "City of Lights",
        destination: "Paris, France",
        duration: "5 Days",
        budget: "$2400",
        image:
          "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
        tags: ["Romance", "Art", "Food", "Culture"],
      },
      {
        id: "12",
        title: "Ancient Wonders",
        destination: "Cairo, Egypt",
        duration: "6 Days",
        budget: "$1600",
        image:
          "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800",
        tags: ["History", "Culture", "Adventure", "Budget"],
      },
    ];

    // Filter recommendations based on tags and exclude current destination
    let filtered = allRecommendations.filter(
      (rec) => rec.destination.toLowerCase() !== destination.toLowerCase()
    );

    // Score recommendations based on tag matches
    const scored = filtered.map((rec) => {
      const matchCount = rec.tags.filter((tag) =>
        tags.some((userTag: string) =>
          tag.toLowerCase().includes(userTag.toLowerCase())
        )
      ).length;

      return {
        ...rec,
        score: matchCount,
      };
    });

    // Sort by score and take top 3
    const topRecommendations = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ score, ...rec }) => rec);

    // If no matches, return random 3
    const finalRecommendations =
      topRecommendations.length > 0
        ? topRecommendations
        : filtered.sort(() => Math.random() - 0.5).slice(0, 3);

    return NextResponse.json({ recommendations: finalRecommendations });
  } catch (error) {
    console.error("Recommendations API error:", error);
    return NextResponse.json({ recommendations: [] }, { status: 200 });
  }
}
