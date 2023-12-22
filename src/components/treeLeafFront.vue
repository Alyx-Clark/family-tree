<template>
    <div class="leaf-front">
        <div class="leaf-wrapper">
            <img src="https://personal-projects.nyc3.digitaloceanspaces.com/family-tree/sabrinaAndCece.jpg" alt="picture of family member">
            <h2>Sabrina Clark</h2>
            <p>01,02,1998 - not dead</p>
        </div>
    </div>
</template>
  
<script>
    import { defineComponent } from 'vue';
    export default defineComponent({
    setup() {
        // Composition API logic goes here

        return {
        // data, methods, etc.
        };
    }
    });
</script>
  
  <style>
  .leaf-front {
    background-color: rgb(242, 154, 102);
    width: 300px;
    border-radius: 10px;
  }
  .leaf-wrapper{
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .leaf-front img{
    max-width: 100px;
  }
  </style>
  