<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal">
      <button type="button" class="btn-close" @click="close">x</button>
      <header class="modal-header" @stop="click">
        <slot name="header"></slot>
      </header>

      <section class="modal-body">
        <slot name="body"></slot>
      </section>
    </div>
  </div>
</template>

<style>
.modal-backdrop {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
}

.modal {
  position: relative;
  background: #ffffff;
  box-shadow: 2px 2px 20px 1px;
  overflow-x: scroll;
  display: flex;
  flex-direction: column;
  border-radius: 0.5rem;
  max-width: 50%;
  max-height: 50%;
}

.modal-header {
  position: relative;
  border-bottom: 1px solid #eeeeee;
  font-weight: bold;
  padding: 0.4rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.modal-body {
  position: relative;
  padding: 1.25rem 0.6rem;
  max-width: 50%;
}

.btn-close {
  position: absolute;
  top: 0;
  right: 0;
  border: none;
  font-size: 1.25rem;
  padding: 0px 0.25rem 0.18rem 0.25rem;
  margin: 4px;
  cursor: pointer;
  font-weight: bold;
  background: transparent;
  color: rgb(185, 6, 6);
  background-color: rgb(226, 226, 226);
  border-radius: 0.3rem;
}

.btn-close:hover {
  background-color: rgb(203, 203, 203);
}

.addbtn {
  background-color: #40d92c;
  color: black;
  border-radius: 0.3rem;
  padding: 0.5rem 0.7rem;
  cursor: pointer;
}

.addbtn:hover {
  background-color: #2c9d1f;
}
</style>

<script>
export default {
  name: "Modal",
  methods: {
    close() {
      this.$emit("close");
    },
  },
};
</script>
