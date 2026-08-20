/**
 * NavGraph.js
 * Waypoint navigation graph with A* pathfinding and line-of-sight validation for enemy AI.
 */

import * as THREE from 'three';

export class NavGraph {
  constructor() {
    this.nodes = [];
    this.raycaster = new THREE.Raycaster();
    this.colliders = [];
  }

  setColliders(colliders) {
    this.colliders = colliders || [];
  }

  addNode(id, x, y, z) {
    const node = {
      id,
      position: new THREE.Vector3(x, y, z),
      neighbors: []
    };
    this.nodes.push(node);
    return node;
  }

  connect(idA, idB) {
    const nodeA = this.nodes.find(n => n.id === idA);
    const nodeB = this.nodes.find(n => n.id === idB);
    if (nodeA && nodeB) {
      if (!nodeA.neighbors.includes(nodeB)) nodeA.neighbors.push(nodeB);
      if (!nodeB.neighbors.includes(nodeA)) nodeB.neighbors.push(nodeA);
    }
  }

  getNearestNode(pos) {
    let bestDist = Infinity;
    let bestNode = null;
    for (let i = 0; i < this.nodes.length; i++) {
      const d = this.nodes[i].position.distanceTo(pos);
      if (d < bestDist) {
        bestDist = d;
        bestNode = this.nodes[i];
      }
    }
    return bestNode;
  }

  findPath(startPos, endPos) {
    if (this.nodes.length === 0) return [endPos];

    // If direct line of sight exists, move directly
    if (this.hasLineOfSight(startPos, endPos)) {
      return [endPos];
    }

    const startNode = this.getNearestNode(startPos);
    const endNode = this.getNearestNode(endPos);

    if (!startNode || !endNode || startNode === endNode) {
      return [endPos];
    }

    // A* Pathfinding
    const openSet = [startNode];
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    this.nodes.forEach(n => {
      gScore.set(n, Infinity);
      fScore.set(n, Infinity);
    });

    gScore.set(startNode, 0);
    fScore.set(startNode, startNode.position.distanceTo(endNode.position));

    while (openSet.length > 0) {
      // Find node in openSet with lowest fScore
      let current = openSet[0];
      let lowestF = fScore.get(current);
      let currentIndex = 0;

      for (let i = 1; i < openSet.length; i++) {
        const score = fScore.get(openSet[i]);
        if (score < lowestF) {
          lowestF = score;
          current = openSet[i];
          currentIndex = i;
        }
      }

      if (current === endNode) {
        // Reconstruct path
        const path = [endPos];
        let curr = current;
        while (cameFrom.has(curr)) {
          path.unshift(curr.position.clone());
          curr = cameFrom.get(curr);
        }
        return path;
      }

      openSet.splice(currentIndex, 1);

      for (let i = 0; i < current.neighbors.length; i++) {
        const neighbor = current.neighbors[i];
        const tentativeG = gScore.get(current) + current.position.distanceTo(neighbor.position);

        if (tentativeG < gScore.get(neighbor)) {
          cameFrom.set(neighbor, current);
          gScore.set(neighbor, tentativeG);
          fScore.set(neighbor, tentativeG + neighbor.position.distanceTo(endNode.position));

          if (!openSet.includes(neighbor)) {
            openSet.push(neighbor);
          }
        }
      }
    }

    // Fallback: direct to endPos if no path found
    return [endPos];
  }

  hasLineOfSight(posA, posB) {
    const dir = new THREE.Vector3().subVectors(posB, posA);
    const dist = dir.length();
    if (dist < 0.1) return true;

    dir.normalize();
    const ray = new THREE.Ray(posA, dir);

    for (let i = 0; i < this.colliders.length; i++) {
      const box = this.colliders[i];
      const hit = ray.intersectBox(box, new THREE.Vector3());
      if (hit && hit.distanceTo(posA) < dist - 0.5) {
        return false; // Obstructed by level collider
      }
    }
    return true;
  }
}
