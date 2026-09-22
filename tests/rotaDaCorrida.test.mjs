// CODEX: 60 linhas criadas neste arquivo; valida embarque, destino e coordenadas inválidas com dados simulados.

import assert from "node:assert/strict";
import test from "node:test";

import { alvoDaCorrida } from "../src/domain/rotaDaCorrida.ts";

const destinos = [
  {
    tipo: "origem",
    latitude: "-8.761160",
    longitude: "-63.900430",
  },
  {
    tipo: "destino",
    latitude: -8.701,
    longitude: -63.91,
  },
];

for (const status of ["aceita", "motorista_chegou"]) {
  test(`${status} desenha do motorista ate o passageiro`, () => {
    assert.deepEqual(
      alvoDaCorrida({ status_corrida: status, corrida_destinos: destinos }),
      { latitude: -8.76116, longitude: -63.90043 },
    );
  });
}

test("em andamento troca o alvo para o destino", () => {
  assert.deepEqual(
    alvoDaCorrida({
      status_corrida: "em_andamento",
      corrida_destinos: destinos,
    }),
    { latitude: -8.701, longitude: -63.91 },
  );
});

for (const status of ["solicitada", "finalizada", "cancelada"]) {
  test(`${status} nao conserva uma rota ativa`, () => {
    assert.equal(
      alvoDaCorrida({ status_corrida: status, corrida_destinos: destinos }),
      null,
    );
  });
}

test("coordenada ausente ou invalida nao gera rota", () => {
  assert.equal(
    alvoDaCorrida({
      status_corrida: "aceita",
      corrida_destinos: [
        { tipo: "origem", latitude: "invalida", longitude: null },
      ],
    }),
    null,
  );
  assert.equal(alvoDaCorrida(null), null);
});
