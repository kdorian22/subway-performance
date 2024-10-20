import  React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { ascending, axisBottom, axisLeft, rollup, scaleBand, scaleLinear, select, sum } from 'd3';
import { PerformanceEvent, Colors } from './Types';
import dayjs from 'dayjs';

type PerformanceTimeSeriesProps = {
    incidents: PerformanceEvent[]
    delays: PerformanceEvent[]
    colors: Colors
    selectedMonth: string | null
    selectedLine: string | null
    lines: string[]
}

const svgHeight = 300

function PerformanceTimeSeries({
        incidents, 
        delays, 
        colors, 
        selectedMonth, 
        selectedLine, 
        lines
    }: PerformanceTimeSeriesProps) {
    const svgRef = useRef(null)
    const [svgSize, setSVGSize] = useState(document?.body?.offsetWidth - (document?.body?.offsetWidth/(document?.body?.offsetWidth < 584 ? 1 : 2.5 )) - 24)
    const margins = {left: 60, top: 15, right: 15, bottom: 50}
    const abbr = svgSize < 300
    const incidentMap = rollup(incidents, (d) => sum(d.map((d) => d.count)), (d) => d.month, (d) => d.line)
    const delayMap = rollup(delays, (d) => sum(d.map((d) => d.count)), (d) => d.month, (d) => d.line)
    const months = [...Array.from(incidentMap).map((d) => d[0]), ...Array.from(delayMap).map((d) => d[0])].sort((a, b) => ascending(a, b))
    const [selectedPlot, setSelectedPlot] = useState<'I' | 'D'>('D')

    useEffect(() => {
		if(document?.body){
			setSVGSize(document?.body?.offsetWidth - (document?.body?.offsetWidth/(document?.body?.offsetWidth < 584 ? 1 : 2.5 )) - 24 || 300)
		}

		function handleResize(this: Window){
			if(document?.body){
				setSVGSize(document?.body?.offsetWidth - (document?.body?.offsetWidth/(document?.body?.offsetWidth < 584 ? 1 : 2.5 )) - 24 || 300)
			}
		}

		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)

	}, [])

    useEffect(() => {
        select(svgRef.current).selectAll('*').remove()

        const width = svgSize - margins.left - margins.right
        const height = svgHeight - margins.top - margins.left

        const svg = select(svgRef.current)
            .attr('width', svgSize)
            .attr('height', svgHeight)
        
        const g = svg.append('g')
            .attr('transform', `translate(${margins.left},${margins.top})`)
        
        g.append('rect')
        .attr('width', width)
        .attr('height', height)
        .style('fill', 'rgb(215,215,215)')

        const xScale = scaleBand().domain(months).range([0, width])
        const yScale = scaleLinear().domain(selectedPlot === 'I' ? [15,0] : [4800,0]).range([0, height])

        const xAxis = g.append('g').call(axisBottom(xScale).tickFormat((d) => dayjs(d).format('MMM-YY'))).attr('transform', `translate(0, ${height})`)
        g.append('g').call(axisLeft(yScale).ticks(5)).attr('transform', `translate(0, 0)`)

        xAxis.selectAll('.tick').style('display', 'none')
        xAxis.selectAll('.tick:nth-child(5n)').style('display', 'block')

        svg.append('text')
        .text('Count')
        .style('font-size', abbr ? '13px' : '16px')
        .attr('transform', `translate(${margins.left/3.5}, ${svgHeight/2})rotate(-90)`)

        svg.append('text')
        .text('Month')
        .style('font-size', abbr ? '13px' : '16px')
        .attr('transform', `translate(${width/2}, ${height + margins.top + margins.bottom / 1.5})`)
        .style('alignment-baseline', 'central')

        lines.forEach((l) => {
            if(l === selectedLine){
                months.forEach((m, i) => {
                    const data = selectedPlot === 'I' ? incidents : delays
                    const filteredData = data.filter((d) => d.month === m && d.line === l)
                    const nextFilteredData = data.filter((d) => d.month === months[i + 1] && d.line === l)
    
                    const val = sum(filteredData.map((f) => f.count))
                    if(selectedMonth === m){
                        g.append('line')
                        .attr('x1', Number(xScale(m)))
                        .attr('x2', Number(xScale(m)))
                        .attr('y1', 0)
                        .attr('y2', height)
                        .attr('stroke', 'black')

                        g.append('text')
                        .attr('x', Number(xScale(m)) + 4)
                        .attr('y', 5)
                        .attr('text-anchor', 'left')
                        .attr('font-size', '10px')
                        .style('font-weight', 'bold')
                        .text(dayjs(selectedMonth).format('MMM YYYY'))

                        g.append('text')
                        .attr('x', Number(xScale(m)) + 4)
                        .attr('y', 15)
                        .attr('text-anchor', 'left')
                        .attr('font-size', '10px')
                        .text(val)
                        
                    }
    
                    if(i < months.length - 1){
                        g.append('line')
                        .attr('x1', Number(xScale(m)))
                        .attr('y1', yScale(val))
                        .attr('x2', Number(xScale(months[i + 1])))
                        .attr('y2', yScale(sum(nextFilteredData.map((f) => f.count))))
                        .attr('stroke', colors[l])
                    }

                    g.append('circle')
                    .attr('cx', Number(xScale(m)))
                    .attr('cy', yScale(sum(filteredData.map((f) => f.count))))
                    .attr('r', 3)
                    .attr('fill', colors[l])
                    .attr('stroke','black')
                    .attr('stroke-width', 0.5)

                })
            }
            }
        )
    }, [abbr, colors, delays, incidents, lines, margins.bottom, margins.left, margins.right, margins.top, months, selectedLine, selectedMonth, selectedPlot, svgRef, svgSize])

    if(!selectedLine) return <></>

    return (
        <>
            <span style={{fontSize: '14px', fontWeight: 'bold'}}> {selectedLine} Train {selectedPlot === 'I' ? 'Incidents' : 'Delays'} Over Time</span>
            <svg ref={svgRef}> </svg>
        </>
        )
}

export default PerformanceTimeSeries;
