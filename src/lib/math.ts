/**
 * Arredonda para evitar mismatch de hidratação: Math.cos/sin podem retornar
 * o último bit diferente entre o V8 do Node (SSR) e o do browser, o que faz
 * o React comparar "27.018666706430658" (server) com 27.01866670643066
 * (client) como valores distintos. Arredondar para poucas casas garante que
 * server e client sempre serializem a mesma string.
 */
export function round(n: number, decimals = 4) {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
