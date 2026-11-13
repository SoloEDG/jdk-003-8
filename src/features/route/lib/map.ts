import type { Region, RouteNode, NodeKind } from "@/shared/domain";
import { cards } from "@/shared/cards";
const regionCurses: Record<Region, string> = {
  forest: "bleedMark",
  forge: "rustChain",
  abyss: "ashWhisper",
};
export function nodeCurseLabel(node: RouteNode) {
  return node.curse ? (cards[node.curse]?.name ?? node.curse) : "";
}
export function makeMap(): RouteNode[] {
  const result: RouteNode[] = [];
  const regions: Region[] = ["forest", "forge", "abyss"];
  for (let depth = 0; depth < 9; depth++) {
    const region = regions[Math.floor(depth / 3)]!;
    for (let lane = 0; lane < 2; lane++) {
      const kind: NodeKind =
        depth === 8
          ? "boss"
          : depth % 3 === 1
            ? lane === 0
              ? "shop"
              : "camp"
            : lane === 0
              ? "battle"
              : "elite";
      const curse =
        kind === "elite" && depth > 0 ? regionCurses[region] : undefined;
      const curseName = curse ? cards[curse]!.name : "";
      result.push({
        id: `n${depth}-${lane}`,
        region,
        depth,
        lane,
        kind,
        title:
          kind === "boss"
            ? "裂隙守望者"
            : kind === "elite"
              ? curseName
                ? `危险捷径 · ${curseName}`
                : "危险捷径"
              : kind === "shop"
                ? "游商营地"
                : kind === "camp"
                  ? "熄风篝火"
                  : "失落哨站",
        curse,
        influence:
          lane === 0
            ? { heat: 0, favor: 1, scarcity: 0 }
            : { heat: 1, favor: 0, scarcity: 1 },
        next: depth === 8 ? [] : [`n${depth + 1}-0`, `n${depth + 1}-1`],
      });
    }
  }
  return result;
}
