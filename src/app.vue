<template>
    <div id="app">
        <TreeLeafFront/>
        <TreeLeafBack/>
    </div>
</template>
  
<script>
    import TreeLeafFront from './components/treeLeafFront.vue';
    import TreeLeafBack from './components/treeLeafBack.vue';

    export default {
        components: {
            TreeLeafFront,
            TreeLeafBack,
        }
    };
</script>
  