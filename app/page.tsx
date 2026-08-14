import { HomeExplorer } from "@/components/home/HomeExplorer";
import { apartments, planRegistry } from "@/lib/data";

export default function HomePage() {
  return <HomeExplorer apartments={apartments} plans={planRegistry} />;
}
