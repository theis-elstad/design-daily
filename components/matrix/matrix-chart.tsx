'use client'

import { useState, useMemo } from 'react'
import { getAvatarUrl } from '@/lib/utils'
import type { LeaderboardEntry } from '@/lib/types/database'
import { RocketIconPaths, DavidIconPaths } from './matrix-icons'

const CHART = {
  width: 700,
  height: 700,
  padding: { top: 60, right: 60, bottom: 80, left: 80 },
  get plotLeft() { return this.padding.left },
  get plotRight() { return this.width - this.padding.right },
  get plotTop() { return this.padding.top },
  get plotBottom() { return this.height - this.padding.bottom },
  get plotWidth() { return this.plotRight - this.plotLeft },
  get plotHeight() { return this.plotBottom - this.plotTop },
}

const NODE_RADIUS = 20
const SCORES = [1, 2, 3, 4, 5]

function scoreToX(p: number): number {
  return CHART.plotLeft + ((p - 1) / 4) * CHART.plotWidth
}

function scoreToY(q: number): number {
  return CHART.plotBottom - ((q - 1) / 4) * CHART.plotHeight
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

type PositionedNode = {
  entry: LeaderboardEntry
  cx: number
  cy: number
}

function computeNodes(entries: LeaderboardEntry[]): PositionedNode[] {
  // Group by rounded (productivity, quality) position
  const groups = new Map<string, LeaderboardEntry[]>()
  for (const entry of entries) {
    const px = Math.max(1, Math.min(5, Math.round(entry.avg_productivity)))
    const qy = Math.max(1, Math.min(5, Math.round(entry.avg_quality)))
    const key = `${px},${qy}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(entry)
  }

  const positioned: PositionedNode[] = []

  for (const [key, group] of groups) {
    const [px, qy] = key.split(',').map(Number)
    const centerX = scoreToX(px)
    const centerY = scoreToY(qy)

    if (group.length === 1) {
      positioned.push({ entry: group[0], cx: centerX, cy: centerY })
      continue
    }

    // Radial distribution for overlapping nodes
    const spreadRadius = group.length <= 3 ? 28 : group.length <= 6 ? 36 : 44
    const angleStep = (2 * Math.PI) / group.length
    const startAngle = -Math.PI / 2

    for (let i = 0; i < group.length; i++) {
      const angle = startAngle + i * angleStep
      positioned.push({
        entry: group[i],
        cx: centerX + Math.cos(angle) * spreadRadius,
        cy: centerY + Math.sin(angle) * spreadRadius,
      })
    }
  }

  return positioned
}

interface MatrixChartProps {
  entries: LeaderboardEntry[]
}

export function MatrixChart({ entries }: MatrixChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const nodes = useMemo(() => computeNodes(entries), [entries])

  const hoveredNode = nodes.find((n) => n.entry.user_id === hoveredId)

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No data available for this time period.</p>
        <p className="text-sm mt-1">Submissions with ratings will appear here.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border p-4 sm:p-8">
      <div className="relative max-w-[700px] mx-auto">
        <svg
          viewBox={`0 0 ${CHART.width} ${CHART.height}`}
          className="w-full h-auto"
          role="img"
          aria-label="Performance matrix chart plotting designers by productivity and quality"
        >
          {/* Grid lines (dashed, subtle) */}
          {SCORES.map((score) => (
            <g key={`grid-${score}`}>
              <line
                x1={scoreToX(score)}
                y1={CHART.plotTop}
                x2={scoreToX(score)}
                y2={CHART.plotBottom}
                stroke="#e5e7eb"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <line
                x1={CHART.plotLeft}
                y1={scoreToY(score)}
                x2={CHART.plotRight}
                y2={scoreToY(score)}
                stroke="#e5e7eb"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            </g>
          ))}

          {/* Quadrant midlines at 2.5 (stronger) */}
          <line
            x1={scoreToX(2.5)}
            y1={CHART.plotTop}
            x2={scoreToX(2.5)}
            y2={CHART.plotBottom}
            stroke="#d1d5db"
            strokeWidth="1.5"
          />
          <line
            x1={CHART.plotLeft}
            y1={scoreToY(2.5)}
            x2={CHART.plotRight}
            y2={scoreToY(2.5)}
            stroke="#d1d5db"
            strokeWidth="1.5"
          />

          {/* Axis score labels */}
          {SCORES.map((score) => (
            <g key={`labels-${score}`}>
              {/* X-axis numbers */}
              <text
                x={scoreToX(score)}
                y={CHART.plotBottom + 24}
                textAnchor="middle"
                fill="#9ca3af"
                style={{ fontSize: 13 }}
              >
                {score}
              </text>
              {/* Y-axis numbers */}
              <text
                x={CHART.plotLeft - 18}
                y={scoreToY(score)}
                textAnchor="end"
                dominantBaseline="central"
                fill="#9ca3af"
                style={{ fontSize: 13 }}
              >
                {score}
              </text>
            </g>
          ))}

          {/* Axis title labels */}
          <text
            x={(CHART.plotLeft + CHART.plotRight) / 2}
            y={CHART.plotBottom + 56}
            textAnchor="middle"
            fill="#6b7280"
            style={{ fontSize: 14, fontWeight: 500 }}
          >
            Productivity
          </text>
          <text
            x={CHART.plotLeft - 50}
            y={(CHART.plotTop + CHART.plotBottom) / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#6b7280"
            style={{ fontSize: 14, fontWeight: 500 }}
            transform={`rotate(-90, ${CHART.plotLeft - 50}, ${(CHART.plotTop + CHART.plotBottom) / 2})`}
          >
            Quality
          </text>

          {/* Decorative icons */}
          <g
            transform={`translate(${CHART.plotRight + 10}, ${CHART.plotBottom - 42}) scale(0.85)`}
            style={{ color: '#d1d5db' }}
          >
            <RocketIconPaths />
          </g>
          <g
            transform={`translate(${CHART.plotLeft - 8}, ${CHART.plotTop - 54}) scale(0.75)`}
            style={{ color: '#d1d5db' }}
          >
            <DavidIconPaths />
          </g>

          {/* Clip path definitions for avatar circles */}
          <defs>
            {nodes.map(({ entry }) => (
              <clipPath key={`clip-${entry.user_id}`} id={`clip-${entry.user_id}`}>
                <circle r={NODE_RADIUS - 1.5} />
              </clipPath>
            ))}
          </defs>

          {/* Designer nodes */}
          {nodes.map(({ entry, cx, cy }) => {
            const isHovered = hoveredId === entry.user_id
            const avatarUrl = getAvatarUrl(entry.avatar_path)

            return (
              <g
                key={entry.user_id}
                style={{
                  transform: `translate(${cx}px, ${cy}px) scale(${isHovered ? 1.3 : 1})`,
                  transformOrigin: '0 0',
                  transition: 'transform 150ms ease-out, filter 150ms ease-out',
                  filter: isHovered
                    ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.18))'
                    : 'drop-shadow(0 1px 3px rgba(0,0,0,0.08))',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHoveredId(entry.user_id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() =>
                  setHoveredId((prev) => (prev === entry.user_id ? null : entry.user_id))
                }
              >
                {/* Node background circle */}
                <circle
                  r={NODE_RADIUS}
                  cx={0}
                  cy={0}
                  fill="white"
                  stroke={isHovered ? '#9ca3af' : '#e5e7eb'}
                  strokeWidth={isHovered ? 2 : 1.5}
                />

                {/* Avatar image or initials */}
                {avatarUrl ? (
                  <image
                    href={avatarUrl}
                    x={-(NODE_RADIUS - 1.5)}
                    y={-(NODE_RADIUS - 1.5)}
                    width={(NODE_RADIUS - 1.5) * 2}
                    height={(NODE_RADIUS - 1.5) * 2}
                    clipPath={`url(#clip-${entry.user_id})`}
                    preserveAspectRatio="xMidYMid slice"
                  />
                ) : (
                  <text
                    x={0}
                    y={0}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#6b7280"
                    style={{ fontSize: 11, fontWeight: 500, pointerEvents: 'none' }}
                  >
                    {getInitials(entry.full_name)}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* HTML tooltip overlay */}
        {hoveredNode && (
          <div
            className="absolute pointer-events-none z-10 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 transition-opacity duration-150"
            style={{
              left: `${(hoveredNode.cx / CHART.width) * 100}%`,
              top: `${(hoveredNode.cy / CHART.height) * 100}%`,
              transform: 'translate(-50%, calc(-100% - 28px))',
            }}
          >
            <p className="font-semibold text-gray-900 text-sm whitespace-nowrap">
              {hoveredNode.entry.full_name || 'Unknown'}
            </p>
            <div className="flex gap-3 mt-0.5 text-gray-500 text-xs whitespace-nowrap">
              <span>Productivity: {hoveredNode.entry.avg_productivity.toFixed(1)}</span>
              <span>Quality: {hoveredNode.entry.avg_quality.toFixed(1)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
