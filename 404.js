/* Página 404: redireciona endereços antigos que mudaram de nome (notas renomeadas). Sem dados do visitante. */
(function () {
  var MOVIDAS = {
    '/notas/pratical-ethical-hacking.html': '/notas/practical-ethical-hacking.html',
    '/notas/commonly-ports.html': '/notas/common-ports.html',
    '/notas/disc-usage-folder-sizes-cpu-info.html': '/notas/disk-usage-folder-sizes-cpu-info.html',
    '/notas/virtu.html': '/notas/virtualization.html'
  };
  var destino = MOVIDAS[location.pathname];
  if (destino) location.replace(destino + location.hash);
})();
