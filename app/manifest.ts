import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kinetic Performance",
    short_name: "Kinetic",
    description: "Custom Health and Recovery Tracker",
    start_url: "/",
    display: "standalone", // Tricks Safari into hiding browser bars
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
