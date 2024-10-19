import  React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { ascending, axisBottom, axisLeft, rollup, scaleLinear, select } from 'd3';
import { PerformanceEvent, Colors } from './Types';

type MonthAgg = {
    line: string,
    delays: number,
    incidents: number
}

type PerformancePlotProps = {
    incidents: PerformanceEvent[]
    delays: PerformanceEvent[]
    colors: Colors
    selectedMonth: string | null
    setSelectedMonth: (selectedMonth: string | null) => void
    lines: string[]
}

function PerformancePlot({incidents, delays, colors, selectedMonth, setSelectedMonth, lines}: PerformancePlotProps) {
    const svgRef = useRef(null)
    const [svgSize, setSVGSize] = useState(((document?.body?.offsetWidth/(document?.body?.offsetWidth < 584 ? 1 : 2.5 )) - 24) || 584 - 24)
    const margins = {left: 60, top: 15, right: 15, bottom: 50}
    const abbr = svgSize < 300
    const incidentMap = rollup(incidents, (d) => d.length, (d) => d.month, (d) => d.line)
    const delayMap = rollup(delays, (d) => d.length, (d) => d.month, (d) => d.line)
    const months = [...Array.from(incidentMap).map((d) => d[0]), ...Array.from(delayMap).map((d) => d[0])].sort((a, b) => ascending(a, b))
    

    useEffect(() => {
		if(document?.body){
			setSVGSize((document?.body?.offsetWidth/(document?.body?.offsetWidth < 584 ? 1 : 2.5 )) - 24)
		}

		function handleResize(this: Window){
			if(document?.body){
				setSVGSize((document?.body?.offsetWidth/(document?.body?.offsetWidth < 584 ? 1 : 2.5 )) - 24)
			}
		}

		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)

	}, [])

    useEffect(() => {
        select(svgRef.current).selectAll('*').remove()

        if(!selectedMonth && months.length){
            setSelectedMonth(months[0])
        }

        if(selectedMonth){
            const monthIncident = incidentMap.get(selectedMonth)
            const monthDelay = delayMap.get(selectedMonth)
            const monthAgg: MonthAgg[] = []
            lines.forEach((d) => {
                    const lineIncident = monthIncident?.get(d)
                    const lineDelay = monthDelay?.get(d)
                    monthAgg.push({'line': d, incidents: lineIncident || 0, delays: lineDelay || 0})
                }   
            )
            console.log(svgSize)

		    const width = svgSize - margins.left - margins.right
            const height = svgSize - margins.top - margins.left

            const svg = select(svgRef.current)
                .attr('width', svgSize)
                .attr('height', svgSize)
            
            const g = svg.append('g')
                .attr('transform', `translate(${margins.left},${margins.top})`)

		    const xScale = scaleLinear().domain([0, 10]).range([0, width])
            const yScale = scaleLinear().domain([60,0]).range([0, height])
            
            const ele = g.selectAll('circ')
            .data(monthAgg.filter((d) => d.delays && d.incidents))
            .enter()
            .append('g')
            
            ele.append('circle')
            .attr('cx', (d) => xScale(d.incidents))
            .attr('cy', (d) => yScale(d.delays))
            .attr('r', abbr ? 12 : 16) 
            .attr('fill', (d) => colors[d.line])
            .attr('stroke', 'black')

            ele.append('text')
            .attr('x', (d) => xScale(d.incidents))
            .attr('y', (d) => yScale(d.delays))
            .text((d) => d.line)
            .style('font-size', abbr ? '10px' : '18px' )
            .style('alignment-baseline', 'central')
            .style('text-anchor', 'middle')
            .style('fill', (d) => ['N', 'R', 'W', 'Q'].includes(d.line) ? 'black' : 'white')

            g.append('g').call(axisBottom(xScale).ticks(5)).attr('transform', `translate(0, ${height})`)
            g.append('g').call(axisLeft(yScale).ticks(5)).attr('transform', `translate(0, 0)`)

            svg.append('text')
            .text('Delays')
            .style('font-size', abbr ? '13px' : '16px')
            .attr('transform', `translate(${margins.left/2.5}, ${svgSize/2})rotate(-90)`)

            svg.append('text')
            .text('Major Incidents')
            .style('font-size', abbr ? '13px' : '16px')
            .attr('transform', `translate(${width/2}, ${height + margins.top + margins.bottom / 1.5})`)
            .style('alignment-baseline', 'central')

            
        }
    }, [abbr, colors, delayMap, incidentMap, lines, margins.bottom, margins.left, margins.right, margins.top, months, selectedMonth, setSelectedMonth, svgRef, svgSize])

    return (
    <div> 
        <svg ref={svgRef}> </svg>
    </div>
    );
}

export default PerformancePlot;
