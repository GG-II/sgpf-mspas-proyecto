console.log('🔥 ENCARGADO V2 CARGADO');

window.EncargadoDashboard = {
    async init() {
        console.log('🏥 INIT V2');
        
        const user = SGPF.getCurrentUser();
        if (!user || user.rol !== 'encargado_sr') return;

        document.getElementById('encargado-nombre').textContent = `${user.nombres} ${user.apellidos}`;

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