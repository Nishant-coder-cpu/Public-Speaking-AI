/**
 * Design System Test Component
 * This component tests all aspects of the Tailwind configuration
 * including colors, typography, spacing, animations, and responsive breakpoints
 */

export default function DesignSystemTest() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 lg:p-12">
      {/* Typography Test */}
      <section className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Typography Scale</h1>
        <p className="text-xs mb-2">Extra Small Text (xs)</p>
        <p className="text-sm mb-2">Small Text (sm)</p>
        <p className="text-base mb-2">Base Text (base)</p>
        <p className="text-lg mb-2">Large Text (lg)</p>
        <p className="text-xl mb-2">Extra Large Text (xl)</p>
        <p className="text-2xl mb-2">2XL Text (2xl)</p>
        <p className="text-3xl mb-2">3XL Text (3xl)</p>
        <p className="text-4xl mb-2">4XL Text (4xl)</p>
      </section>

      {/* Color Palette Test */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Color Palette</h2>
        
        {/* Primary Colors */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">Primary (Indigo)</h3>
          <div className="flex gap-2 flex-wrap">
            <div className="w-20 h-20 bg-primary-500 rounded-lg flex items-center justify-center text-white text-sm">500</div>
            <div className="w-20 h-20 bg-primary-600 rounded-lg flex items-center justify-center text-white text-sm">600</div>
            <div className="w-20 h-20 bg-primary-700 rounded-lg flex items-center justify-center text-white text-sm">700</div>
          </div>
        </div>

        {/* Secondary Colors */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">Secondary (Blue)</h3>
          <div className="flex gap-2 flex-wrap">
            <div className="w-20 h-20 bg-secondary-500 rounded-lg flex items-center justify-center text-white text-sm">500</div>
            <div className="w-20 h-20 bg-secondary-600 rounded-lg flex items-center justify-center text-white text-sm">600</div>
            <div className="w-20 h-20 bg-secondary-700 rounded-lg flex items-center justify-center text-white text-sm">700</div>
          </div>
        </div>

        {/* Success Colors */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">Success (Green)</h3>
          <div className="flex gap-2 flex-wrap">
            <div className="w-20 h-20 bg-success-500 rounded-lg flex items-center justify-center text-white text-sm">500</div>
            <div className="w-20 h-20 bg-success-600 rounded-lg flex items-center justify-center text-white text-sm">600</div>
          </div>
        </div>

        {/* Error Colors */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">Error (Red)</h3>
          <div className="flex gap-2 flex-wrap">
            <div className="w-20 h-20 bg-error-500 rounded-lg flex items-center justify-center text-white text-sm">500</div>
            <div className="w-20 h-20 bg-error-600 rounded-lg flex items-center justify-center text-white text-sm">600</div>
          </div>
        </div>
      </section>

      {/* Gradient Test */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Gradients</h2>
        <div className="bg-gradient-to-br from-primary-500 to-secondary-600 text-white p-8 rounded-lg mb-4">
          <p className="text-xl font-semibold">Primary Gradient Background (Diagonal)</p>
        </div>
        <div className="bg-gradient-to-r from-primary-600 to-secondary-700 text-white p-8 rounded-lg mb-4">
          <p className="text-xl font-semibold">Primary Gradient (Left to Right)</p>
        </div>
        <button className="bg-gradient-to-br from-primary-500 to-secondary-600 hover:from-primary-600 hover:to-secondary-700 text-white px-6 py-3 rounded-lg transition-all">
          Gradient Button with Hover
        </button>
      </section>

      {/* Animation Test */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Animations</h2>
        <div className="animate-fade-in bg-white p-6 rounded-lg shadow-lg">
          <p className="text-lg">This card uses the fade-in animation</p>
        </div>
      </section>

      {/* Spacing Test */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Spacing Utilities</h2>
        <div className="space-y-4">
          <div className="bg-primary-100 p-4 rounded">Padding: p-4</div>
          <div className="bg-primary-100 p-6 rounded">Padding: p-6</div>
          <div className="bg-primary-100 p-8 rounded">Padding: p-8</div>
          <div className="bg-primary-100 p-12 rounded">Padding: p-12</div>
        </div>
      </section>

      {/* Responsive Breakpoints Test */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Responsive Breakpoints</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="bg-primary-500 text-white p-6 rounded-lg">
            <p className="font-semibold">Column 1</p>
            <p className="text-sm">1 col mobile, 2 tablet, 3 desktop, 4 xl</p>
          </div>
          <div className="bg-secondary-500 text-white p-6 rounded-lg">
            <p className="font-semibold">Column 2</p>
            <p className="text-sm">Responsive grid layout</p>
          </div>
          <div className="bg-success-500 text-white p-6 rounded-lg">
            <p className="font-semibold">Column 3</p>
            <p className="text-sm">Resize to test</p>
          </div>
          <div className="bg-error-500 text-white p-6 rounded-lg">
            <p className="font-semibold">Column 4</p>
            <p className="text-sm">Breakpoints working</p>
          </div>
        </div>
      </section>

      {/* Component Examples */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Component Examples</h2>
        
        {/* Upload Box Style */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary-500 transition-colors cursor-pointer mb-6">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-2">☁️</div>
          <p className="text-sm text-gray-600">Upload Box Style</p>
        </div>

        {/* Feedback Card Style */}
        <div className="bg-white rounded-lg shadow-lg p-6 animate-fade-in mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Feedback Card Style</h3>
          <p className="text-gray-700 mb-4">This demonstrates the feedback card styling with proper spacing and typography.</p>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
            Action Button
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">Progress Bar (60%)</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: '60%' }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
