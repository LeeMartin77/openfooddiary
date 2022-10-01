<script lang="ts">
    import { scaleLinear } from 'd3-scale';
    import { max, min } from 'd3-array';
    import type { FoodLogEntry } from '../types/FoodLogEntry';

    export let data: FoodLogEntry[] = []

    interface CalorieChartData {
        durationms: number,
        startms: number,
        endms: number,
        calories: number,
        caloriesperms: number
    }

    const startTime = min(data, (d: FoodLogEntry) => new Date(d.time.start).getTime());
    const endTime = max(data, (d: FoodLogEntry) => new Date(d.time.end).getTime());

    $: chartData = data.map(raw => {
        const durationms = new Date(raw.time.end).getTime() - new Date(raw.time.start).getTime()
        return {
            durationms,
            startms: new Date(raw.time.start).getTime() - startTime,
            endms: new Date(raw.time.end).getTime() - startTime,
            calories: raw.metrics.calories,
            caloriesperms: raw.metrics.calories / durationms
        } as CalorieChartData
    })

    const width = 420;
    const height = 240;

    $: yScale = scaleLinear()
        .domain([0, max(chartData, (d: CalorieChartData) => d.caloriesperms)])
        .range([0, height]);
    $: xScale = scaleLinear()
        .domain([
            0,
            endTime - startTime
        ])
        .range([0, width]);

</script>
{#if data.length > 0}
    <svg {width} {height}>
        {#each chartData as entry}
            <rect 
                x={xScale(entry.startms)}
                y={height - yScale(entry.caloriesperms)}
                width={xScale(entry.durationms)}
                height={yScale(entry.caloriesperms)}
            />
        {/each}
    </svg>
{/if}
<style lang="scss">

</style>