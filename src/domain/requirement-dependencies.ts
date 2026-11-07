export type DependencyNode = { id: string; dependsOn?: readonly string[] };

/** Dependency edges are independent of parent/child edges. Never infer or repair links. */
export function validateRequirementDependencies(nodes: readonly DependencyNode[]): void {
  const byId = new Map(nodes.map(node => [node.id, node]));
  if (byId.size !== nodes.length) throw new Error('DUPLICATE_ID');
  const done = new Set<string>();
  const path: string[] = [];
  const visit = (id: string): void => {
    if (path.includes(id)) throw new Error(`REQUIREMENT_DEPENDENCY_CYCLE: ${[...path, id].join(' -> ')}`);
    if (done.has(id)) return;
    const node = byId.get(id);
    if (!node) throw new Error(`REQUIREMENT_DEPENDENCY_NOT_FOUND: ${path.at(-1)} -> ${id}`);
    const dependencies = node.dependsOn ?? [];
    if (new Set(dependencies).size !== dependencies.length) throw new Error(`DUPLICATE_REQUIREMENT_DEPENDENCY: ${id}`);
    path.push(id);
    for (const dependency of dependencies) visit(dependency);
    path.pop();
    done.add(id);
  };
  for (const node of nodes) visit(node.id);
}
