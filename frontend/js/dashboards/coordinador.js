console.log('🔥 COORDINADOR V2 CARGADO');

window.CoordinadorDashboard = {
    async init() {
        console.log('🏢 INIT V2');
        
        const user = SGPF.getCurrentUser();
        if (!user || user.rol !== 'coordinador_municipal') return;

        document.getElementById('coordinador-nombre').textContent = `${user.nombres} ${user.apellidos}`;

        try {
            console.log('📊 API CALL');
            const res = await SGPF.apiCall('/reportes/consultas-rapidas/2025', 'GET');
            console.log('✅ RESPUESTA:', res);
            
            if (res?.success) {
                const c = res.data.cumplimiento_general;
                document.getElementById('total-usuarias').textContent = (c.ejecutado || 0).toLocaleString('es-GT');
                document.getElementById('meta-anual').textContent = `${(c.porcentaje || 0).toFixed(1)}%`;
            }
        } catch (e) {
            console.error('❌', e);
        }
    }
};