export default function LoginPage() {
  return (
    <div className="">
      <div className="bg-gray shadow-lg rounded-2xl p-4 sm:p-6 md:p-8  w-full mx-4">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-6 text-center">Iniciar sesión</h1>
        <form className="flex flex-col gap-4">
          <label className="block">
            <span className="sr-only">Usuario</span>
            <input
              type="text"
              placeholder="Usuario"
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </label>

          <label className="block">
            <span className="sr-only">Contraseña</span>
            <input
              type="password"
              placeholder="Contraseña"
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </label>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md text-base font-medium"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
