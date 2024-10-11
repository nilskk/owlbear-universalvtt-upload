interface Point {
  x: number;
  y: number;
}

// Function to calculate the area of a triangle formed by three points
function calculateTriangleArea(a: Point, b: Point, c: Point): number {
  return (
    Math.abs(
      (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2
    ) || Number.MIN_VALUE
  );
}

// Function to simplify a polyline using the Visvalingam-Wyatt algorithm
export function simplifyPolyline(points: Point[], simplificationRatio: number): Point[] {
  if (points.length < 20 || simplificationRatio < 0 || simplificationRatio > 1) {
    // Not enough points or invalid simplification ratio
    return points;
  }

  const n = points.length;

  // Calculate the area for each interior point
  const triangleAreas: number[] = [];
  for (let i = 1; i < n - 1; i++) {
    const area = calculateTriangleArea(points[i - 1], points[i], points[i + 1]);
    triangleAreas.push(area);
  }

  // Sort the points based on the triangle areas
  const sortedIndices = triangleAreas
    .map((area, index) => ({ area, index }))
    .sort((a, b) => b.area - a.area)
    .map(item => item.index);

  // Determine the number of points to keep based on the simplification ratio
  const numPointsToKeep = Math.max(2, Math.floor((1 - simplificationRatio) * (n - 2)));

  // Sort and slice the indices array to keep the required points
  const indicesToKeep = sortedIndices.slice(0, numPointsToKeep).sort((a, b) => a - b);

  // Create the simplified polyline
  const simplifiedPolyline = [points[0], ...indicesToKeep.map(i => points[i]), points[n - 1]];

  return simplifiedPolyline;
}

