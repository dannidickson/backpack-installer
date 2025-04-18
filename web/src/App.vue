<script setup lang="ts"></script>

<template>
  <div class="logo-background"></div>
  <div class="backpack">
    <main class="backpack-container" aria-live="polite" role="region">
      <nav class="backpack-navigation" aria-label="Backpack navigation" v-show="showSteps">
        <h2>Silverstripe's Backpack</h2>

        <div class="backpack-steps">
          <h3>Steps</h3>
          <ol>
            <li class="backpack-navigation__item">
              <button class="backpack-navigation__button" @click="setStep('basics')">
                The basics
              </button>
            </li>
            <li class="backpack-navigation__item">
              <button class="backpack-navigation__button" @click="setStep('modules')">
                Pick modules
              </button>
            </li>
            <li class="backpack-navigation__item">
              <button class="backpack-navigation__button" @click="setStep('extras')">
                Pick extras
              </button>
            </li>
            <li class="backpack-navigation__item">
              <button class="backpack-navigation__button" @click="setStep('finished')">
                Finished
              </button>
            </li>
          </ol>
        </div>
      </nav>

      <section class="backpack-section" v-if="isStep('welcome')">
        <div class="backpack-section__content">
          <h1>Welcome to the Backpack</h1>
          <p>Jump start a Silverstripe project within a few clicks</p>

          <div class="backpack-intro-steps">
            <div class="backpack-intro-steps__item">
              <h2>1. The basics</h2>
              <p>Choose a name for your site and pick the modules you want to install.</p>
            </div>

            <div class="backpack-intro-steps__item">
              <h2>2. Pick modules</h2>
              <p>Choose the modules you want to install.</p>
            </div>

            <div class="backpack-intro-steps__item">
              <h2>3. Add extras</h2>
              <p>Choose any extra features you might want to install</p>
            </div>

            <div class="backpack-intro-steps__item">
              <h2>4. Finished</h2>
            </div>
          </div>
        </div>

        <footer class="backpack-section__footer">
          <button class="backpack-button" @click="setStep('basics')">Move onto the basics</button>
        </footer>
      </section>

      <section class="backpack-section" v-if="isStep('basics')">
        <div class="backpack-section__header">
          <h2>The basics</h2>
          <p>Tell us about the site</p>
        </div>

        <div class="backpack-section__content">
          <div>
            <label for="siteName">Site Name</label>
            <input id="siteName" type="text" required />
          </div>
          <div>
            <label for="version">Version</label>
            <select id="version" required>
              <option value="5">5</option>
              <option value="6">6</option>
            </select>
          </div>
        </div>

        <footer class="backpack-section__footer">
          <button class="backpack-button" @click="setStep('modules')">Pick modules</button>
        </footer>
      </section>

      <section class="backpack-section" v-if="isStep('modules')">
        <div class="backpack-section__header">
          <h2>Pick modules</h2>
          <p>Pick a selection of modules</p>
        </div>
        <div class="backpack-section__content">
          <div class="module-selection">
            <div
              v-for="module in config.modules"
              :key="module.name"
              class="module-item"
              :class="{ 'module-item--selected': selectedModules.includes(module.name) }"
              @click="toggleModule(module.name)"
            >
              <div class="module-item__checkmark" v-if="selectedModules.includes(module.name)">
                <img src="../src/assets/images/icons/checkmark.svg" alt="">
              </div>
              <h3>{{ module.name }}</h3>
              <p>{{ module.description }}</p>
            </div>
          </div>
        </div>

        <footer class="backpack-section__footer">
          <button class="backpack-button" @click="setStep('basics')">basics</button>
          <button class="backpack-button" @click="setStep('extras')">Pick modules</button>
        </footer>
      </section>

      <section class="backpack-section" v-if="isStep('extras')">
        <div class="backpack-section__header">
          <h2>Pick extras</h2>
          <p>Some extras</p>
        </div>
        
        <div class="backpack-section__content">
        </div>

        <footer class="backpack-section__footer">
          <button class="backpack-button" @click="setStep('modules')">Modules</button>
          <button class="backpack-button" @click="setStep('finished')">Finish</button>
        </footer>
      </section>

      <section class="backpack-section" v-if="isStep('finished')">
        <h2>All finished</h2>
      </section>
    </main>
  </div>
</template>
<style scoped>
.module-selection {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  list-style: none;
  padding: 0;
}

.module-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  margin-bottom: 8px;
  border: 2px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.module-item label {
  pointer-events: none;
}

.module-item--selected {
  background-color: #e6f2ff;
  border-color: #005cb9;
}

.module-item__checkmark {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  width: 1.5rem;
  height: 1.5rem;
}


.module-checkbox {
  margin-right: 10px;
  visibility: hidden;
  display: none;
}
</style>

<script setup lang="ts">
import { ref } from 'vue'
import config from '../../config/modules.json'


console.log(config)
const showSteps = ref<Boolean>(false)
const selectedModules = ref<string[]>([])

const currentStep = ref('welcome')

const isStep = (step: string) => {
  return currentStep.value === step
}

const setStep = (step: string) => {
  currentStep.value = step

  if (step === 'basics') {
    showSteps.value = true
  }

  if (step === 'welcome') {
    showSteps.value = false
  }
}

const toggleModule = (moduleName: string) => {
  if (selectedModules.value.includes(moduleName)) {
    selectedModules.value = selectedModules.value.filter((name) => name !== moduleName)
  } else {
    selectedModules.value.push(moduleName)
  }
}
</script>
