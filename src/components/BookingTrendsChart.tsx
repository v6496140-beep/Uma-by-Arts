import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Appointment } from '../types';

interface BookingTrendsChartProps {
  appointments: Appointment[];
}

interface DataPoint {
  date: Date;
  count: number;
  dateStr: string;
  formattedDate: string;
}

export const BookingTrendsChart: React.FC<BookingTrendsChartProps> = ({ appointments }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Handle responsiveness using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      
      // Debounce slightly or just set state
      setDimensions({
        width: Math.max(width, 300),
        height: Math.max(height, 280)
      });
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Generate the last 30 days of dataset
  const chartData: DataPoint[] = React.useMemo(() => {
    const days: DataPoint[] = [];
    const now = new Date();
    
    // Generate dates representing the last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
      
      const count = appointments.filter(app => {
        // Match only active/confirmed/pending/completed appointments on this date
        return app.appointment_date === dateStr && app.status !== 'cancelled';
      }).length;

      const dateObj = new Date(dateStr + 'T00:00:00');
      days.push({
        date: dateObj,
        count: count,
        dateStr: dateStr,
        formattedDate: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    return days;
  }, [appointments]);

  // Render D3 chart inside SVG
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous drawing

    const { width, height } = dimensions;
    const margin = { top: 25, right: 20, bottom: 35, left: 35 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create main chart group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Define linear gradient for aesthetic area fill
    const defs = svg.append('defs');
    const areaGradient = defs.append('linearGradient')
      .attr('id', 'chart-area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#A68A64')
      .attr('stop-opacity', 0.25);

    areaGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#A68A64')
      .attr('stop-opacity', 0.0);

    // X scale and Y scale
    const xScale = d3.scaleTime()
      .domain(d3.extent(chartData, d => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const maxCount = d3.max(chartData, d => d.count) || 0;
    // Ensure y-scale domain is at least 0-4 for visual scale stability
    const yScale = d3.scaleLinear()
      .domain([0, Math.max(maxCount + 1, 4)])
      .nice()
      .range([innerHeight, 0]);

    // Create custom grid lines for premium structural layout
    const yGrid = d3.axisLeft(yScale)
      .tickSize(-innerWidth)
      .tickFormat(() => '')
      .ticks(5);

    g.append('g')
      .attr('class', 'grid')
      .style('stroke', '#EAE3D9')
      .style('stroke-opacity', 0.4)
      .style('stroke-dasharray', '2,2')
      .call(yGrid)
      .select('.domain').remove();

    // Line and Area Generators
    const lineGenerator = d3.line<DataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.count))
      .curve(d3.curveMonotoneX);

    const areaGenerator = d3.area<DataPoint>()
      .x(d => xScale(d.date))
      .y0(innerHeight)
      .y1(d => yScale(d.count))
      .curve(d3.curveMonotoneX);

    // Append Area Path
    g.append('path')
      .datum(chartData)
      .attr('fill', 'url(#chart-area-gradient)')
      .attr('d', areaGenerator);

    // Append Line Path
    g.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', '#A68A64')
      .attr('stroke-width', 2.5)
      .attr('stroke-linecap', 'round')
      .attr('d', lineGenerator);

    // Custom Axes Style
    const xAxis = d3.axisBottom(xScale)
      .ticks(Math.max(Math.floor(innerWidth / 80), 3))
      .tickFormat((d) => d3.timeFormat('%b %d')(d as Date));

    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d3.format('d'));

    // X Axis group
    const xAxisGroup = g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain')
      .attr('stroke', '#EAE3D9')
      .attr('stroke-width', 1);

    xAxisGroup.selectAll('.tick line')
      .attr('stroke', '#EAE3D9');

    xAxisGroup.selectAll('.tick text')
      .attr('fill', '#7C6A53')
      .attr('font-size', '10px')
      .attr('font-family', 'sans-serif')
      .attr('dy', '10px');

    // Y Axis group
    const yAxisGroup = g.append('g')
      .call(yAxis);

    yAxisGroup.select('.domain').remove(); // remove left border line

    yAxisGroup.selectAll('.tick line')
      .attr('stroke', '#EAE3D9');

    yAxisGroup.selectAll('.tick text')
      .attr('fill', '#7C6A53')
      .attr('font-size', '10px')
      .attr('font-family', 'sans-serif')
      .attr('dx', '-4px');

    // Interactive Hover Dots and overlay
    const interactiveGroup = g.append('g');

    // Create interactive overlay to capture pointer moves
    interactiveGroup.selectAll('.hover-dot')
      .data(chartData)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.count))
      .attr('r', 4)
      .attr('fill', '#FFFFFF')
      .attr('stroke', '#A68A64')
      .attr('stroke-width', 2)
      .attr('style', 'cursor: pointer; transition: r 0.1s ease-out;')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('r', 7).attr('fill', '#A68A64').attr('stroke', '#FFFFFF');
        
        // Find screen coordinates for tooltip placement
        const [mx, my] = d3.pointer(event, svgRef.current);
        setHoveredPoint(d);
        setTooltipPos({ x: mx, y: my });
      })
      .on('mousemove', function (event) {
        const [mx, my] = d3.pointer(event, svgRef.current);
        setTooltipPos({ x: mx, y: my });
      })
      .on('mouseleave', function () {
        d3.select(this).attr('r', 4).attr('fill', '#FFFFFF').attr('stroke', '#A68A64');
        setHoveredPoint(null);
      });

  }, [chartData, dimensions]);

  return (
    <div className="relative w-full h-full min-h-[280px]" ref={containerRef}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="overflow-visible"
      />
      
      {/* Tooltip Popup Panel */}
      {hoveredPoint && (
        <div
          className="absolute z-30 pointer-events-none bg-[#2C2621] text-white px-3 py-2 rounded-lg shadow-xl border border-[#A68A64]/30 text-left transition-all duration-75"
          style={{
            left: `${tooltipPos.x + 15}px`,
            top: `${tooltipPos.y - 45}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <p className="text-[10px] font-bold tracking-wider text-[#EAE3D9] uppercase">
            {hoveredPoint.formattedDate}
          </p>
          <p className="text-sm font-semibold mt-0.5">
            {hoveredPoint.count} {hoveredPoint.count === 1 ? 'Booking' : 'Bookings'}
          </p>
        </div>
      )}
    </div>
  );
};
