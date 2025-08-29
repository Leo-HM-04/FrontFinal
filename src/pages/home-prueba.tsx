

import { motion } from 'framer-motion';

export default function HomePrueba() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 relative overflow-hidden">
      {/* Fondo animado */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      >
        <motion.div
          className="absolute left-1/2 top-1/3 w-[600px] h-[600px] bg-blue-700 opacity-30 rounded-full blur-3xl -translate-x-1/2"
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-10 bottom-10 w-80 h-80 bg-blue-400 opacity-20 rounded-full blur-2xl"
          animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
        />
      </motion.div>
      <motion.main
        className="relative z-10 w-full max-w-3xl flex flex-col md:flex-row items-center gap-10 bg-blue-950/80 rounded-3xl shadow-2xl border border-blue-800 p-10 md:p-16"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        {/* Avatar y datos de usuario de prueba */}
        <motion.section
          className="flex flex-col items-center md:items-start w-full md:w-1/3"
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
        >
          <motion.div
            className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 border-4 border-blue-200 shadow-lg mb-4 flex items-center justify-center"
            whileHover={{ scale: 1.07, rotate: 2 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <span className="text-5xl text-white font-bold select-none">🐾</span>
          </motion.div>
          <div className="text-center md:text-left">
            <motion.h2
              className="text-xl font-semibold text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              Braxton v1.0
            </motion.h2>
            <p className="text-blue-200 text-sm mt-1">Panel de pruebas UI</p>
            <div className="flex gap-2 mt-3 justify-center md:justify-start">
              <span className="bg-blue-800 text-blue-200 px-2 py-1 rounded text-xs">Dark Theme</span>
              <span className="bg-blue-800 text-blue-200 px-2 py-1 rounded text-xs">Responsive</span>
            </div>
          </div>
        </motion.section>
        {/* Panel principal */}
        <motion.section
          className="flex-1 w-full flex flex-col items-center md:items-start"
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
        >
          <motion.h1
            className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            Bright Portfolio <span className="text-blue-400">Template</span>
          </motion.h1>
          <motion.p
            className="text-blue-200 text-lg mb-8 max-w-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            Ejemplo de home profesional inspirado en portafolios modernos. Animaciones, tema oscuro y diseño responsivo.
          </motion.p>
          <motion.ul
            className="space-y-4 w-full max-w-xs"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.18, delayChildren: 1.2 } }
            }}
          >
            {['Solicitudes', 'Recurrentes', 'Pagos'].map((txt, i) => (
              <motion.li
                key={txt}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 0.6, y: 0 }
                }}
                whileHover={{ scale: 1.04, opacity: 0.8 }}
                className={
                  `block px-6 py-3 rounded-lg font-semibold text-lg shadow text-center cursor-not-allowed select-none ` +
                  (i === 0 ? 'bg-blue-700/60 text-white' : i === 1 ? 'bg-blue-600/60 text-white' : 'bg-blue-500/60 text-white')
                }
              >
                {txt}
              </motion.li>
            ))}
          </motion.ul>
          <motion.div
            className="flex gap-4 mt-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.7 }}
          >
            <span className="bg-blue-800 text-blue-200 px-3 py-1 rounded-full text-xs font-mono">Next.js</span>
            <span className="bg-blue-800 text-blue-200 px-3 py-1 rounded-full text-xs font-mono">Tailwind</span>
            <span className="bg-blue-800 text-blue-200 px-3 py-1 rounded-full text-xs font-mono">TypeScript</span>
          </motion.div>
          <motion.p
            className="text-blue-400 text-xs mt-8 text-center md:text-left"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            Solo visible en <span className="font-semibold">/home-prueba</span>
          </motion.p>
        </motion.section>
      </motion.main>
    </div>
  );
}
