import { useEffect, useState } from "react";
import { Dimensions, Keyboard } from "react-native";

/**
 * Quanto o teclado cobre da janela, em pixels.
 *
 * Devolve 0 quando o sistema já encolheu a janela (adjustResize): nesse caso
 * o rodapé sobe sozinho e compensar de novo empurraria duas vezes. Devolve a
 * altura do teclado quando ele fica por cima (adjustPan ou edge-to-edge), que
 * é quando o rodapé precisa de ajuda.
 */
export function useEspacoDoTeclado() {
  const [espaco, setEspaco] = useState(0);

  useEffect(() => {
    const aoMostrar = Keyboard.addListener("keyboardDidShow", (evento) => {
      const alturaJanela = Dimensions.get("window").height;
      const topoDoTeclado = evento.endCoordinates.screenY;

      setEspaco(Math.max(alturaJanela - topoDoTeclado, 0));
    });

    const aoEsconder = Keyboard.addListener("keyboardDidHide", () =>
      setEspaco(0),
    );

    return () => {
      aoMostrar.remove();
      aoEsconder.remove();
    };
  }, []);

  return espaco;
}
