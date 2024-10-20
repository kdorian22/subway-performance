import  React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { ascending, axisBottom, axisLeft, descending, rollup, scaleLinear, select, sum } from 'd3';
import { PerformanceEvent, Colors } from './Types';
import Slider from '@mui/material/Slider';
import dayjs from 'dayjs';

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
    selectedLine: string | null 
    setSelectedLine: (selectedMonth: string | null) => void
    lines: string[]
}



function PerformancePlot({
        incidents, 
        delays, 
        colors, 
        selectedMonth, 
        setSelectedMonth, 
        selectedLine, 
        setSelectedLine, 
        lines
    }: PerformancePlotProps) {
    const svgRef = useRef(null)
    const [svgSize, setSVGSize] = useState(((document?.body?.offsetWidth/(document?.body?.offsetWidth < 584 ? 1 : 2.5 )) - 24) || 584 - 24)
    const margins = {left: 60, top: 15, right: 15, bottom: 50}
    const abbr = svgSize < 300
    const incidentMap = rollup(incidents, (d) => sum(d.map((d) => d.count)), (d) => d.month, (d) => d.line)
    const delayMap = rollup(delays, (d) => sum(d.map((d) => d.count)), (d) => d.month, (d) => d.line)
    const months = [...Array.from(incidentMap).map((d) => d[0]), ...Array.from(delayMap).map((d) => d[0])].sort((a, b) => ascending(a, b))
    const sliderMarks = [
        {
          value: 0,
          label: dayjs(months[0]).format('MMM. YYYY'),
        },
        {
            value: months.length * .25,
            label: dayjs(months[months.length * .25]).format('MMM. YYYY'),
          },
          {
            value: months.length *.5,
            label: dayjs(months[months.length * .5]).format('MMM. YYYY'),
          },
          {
            value: months.length *.75,
            label: dayjs(months[months.length * .75]).format('MMM. YYYY'),
          },
          {
            value: months.length - 1,
            label: dayjs(months[months.length - 1]).format('MMM. YYYY'),
          },
      ];

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

        const width = svgSize - margins.left - margins.right
        const height = svgSize - margins.top - margins.left

        const svg = select(svgRef.current)
            .attr('width', svgSize)
            .attr('height', svgSize)
        
        const g = svg.append('g')
            .attr('transform', `translate(${margins.left},${margins.top})`)
        
        g.append('rect')
        .attr('width', width)
        .attr('height', height)
        .style('fill', 'rgb(215,215,215)')
        .on('click', () => {
            setSelectedLine(null)
        })


        const xScale = scaleLinear().domain([0, 12]).range([0, width])
        const yScale = scaleLinear().domain([4800,0]).range([0, height])

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
        
        if(selectedMonth){
            const monthIncident = incidentMap.get(selectedMonth)
            const monthDelay = delayMap.get(selectedMonth)
            let monthAgg: MonthAgg[] = []
            lines.forEach((d) => {
                    const lineIncident = monthIncident?.get(d)
                    const lineDelay = monthDelay?.get(d)
                    monthAgg.push({'line': d, incidents: lineIncident || 0, delays: lineDelay || 0})
                }   
            )
            if(selectedLine){
                monthAgg = monthAgg.sort((a, b) => descending(a.line === selectedLine ? 0 : 1, b.line === selectedLine ? 0 : 1))
            }


            const ele = g.selectAll('circ')
            .data(monthAgg.filter((d) => d.delays && d.incidents))
            .enter()
            .append('g')
            .style('opacity', (d) => selectedLine ? d.line === selectedLine ? 1 : .1 : 1)
            .style('cursor', 'pointer')
            .on('click', (_e, d) => {
                if(d.line === selectedLine){
                    setSelectedLine(null)
                }else{
                    setSelectedLine(d.line)
                }  
            })

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

            const toolTip = g.append('g').style('display', 'none')

            
            ele.on('mouseover', (_e, d) => {
                toolTip
                .style('display', 'block')
                .append('rect')
                .attr('x', Number(xScale(d.incidents)) + 18)
                .attr('y',  Number(yScale(d.delays)) - 21)
                .attr('width', 65)
                .attr('height', 40)
                .style('fill', 'rgb(80,80,80)')
                .style('stroke', 'black')
                .style('opacity', 1)
                
                
                toolTip.append('text')
                .attr('x', Number(xScale(d.incidents)) + 22)
                .attr('y', Number(yScale(d.delays)) - 10)
                .style('font-weight', 'bold')
                .style('font-size', '10px')
                .text(`${d.line} Train`)
                .style('fill', 'white')

                toolTip.append('text')
                .attr('x', Number(xScale(d.incidents)) + 22)
                .attr('y', Number(yScale(d.delays))+ 2)
                .style('font-size', '10px')
                .text(`Delays: ${d.delays}`)
                .style('fill', 'white')

                toolTip.append('text')
                .attr('x', Number(xScale(d.incidents)) + 22)
                .attr('y', Number(yScale(d.delays)) + 14)
                .style('font-size', '10px')
                .text(`Incidents: ${d.incidents}`)
                .style('fill', 'white')
            })
            .on('mouseout', (_e, d) => {
                toolTip.selectAll('*').remove()
                toolTip.style('display', 'none')
            })

            
        }
    }, [abbr, colors, delayMap, incidentMap, lines, margins.bottom, margins.left, margins.right, margins.top, months, selectedLine, selectedMonth, setSelectedLine, setSelectedMonth, svgRef, svgSize])

    return (
    <div> 
        <svg ref={svgRef}> </svg>
        <div style={{ paddingLeft: '30px', paddingRight: '30px'}}>
        {selectedMonth && (
            <Slider sx={{color: colors['MTA'] || undefined}} marks={sliderMarks} value={months.indexOf(selectedMonth)} max={months.length} min={0} onChange={(_e, n) => {
                if(Number(n) < months.length){
                    setSelectedMonth(months[Number(n)])
                }
                
            }} />
        )}
        </div>
    </div>
    );
}

export default PerformancePlot;
