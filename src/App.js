const { useState, useRef } = React;

const App = () => {
    // STATES
    const [screen, setScreen] = useState('home'); // 'home', 'encode', 'decode'
    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null); // { title: '', body: '' }
    
    // DATA STATES
    const [message, setMessage] = useState("");
    const [imageLoaded, setImageLoaded] = useState(false);
    const canvasRef = useRef(null);

    // UTILS: Reset when going back
    const goHome = () => {
        setScreen('home');
        setImageLoaded(false);
        setMessage("");
        setModalOpen(false);
    };

    // 1. IMAGE HANDLER
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current;
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                setImageLoaded(true);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    // 2. ENCODE (HACK THIS)
    const handleHack = () => {
        if (!imageLoaded || !message) return alert("SYSTEM ERROR: Missing Input");

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Binary Conversion
        let binary = "";
        for (let i = 0; i < message.length; i++) {
            binary += message.charCodeAt(i).toString(2).padStart(8, '0');
        }
        binary += "00000000"; // Terminator

        if (binary.length > data.length / 4) return alert("OVERFLOW: Text too long");

        // LSB Injection
        for (let i = 0; i < binary.length; i++) {
            const pixelIndex = i * 4;
            const blue = data[pixelIndex + 2];
            const bit = parseInt(binary[i]);

            if (blue % 2 === 0 && bit === 1) data[pixelIndex + 2] += 1;
            else if (blue % 2 === 1 && bit === 0) data[pixelIndex + 2] -= 1;
        }

        ctx.putImageData(imgData, 0, 0);

        // Open Success Modal
        setModalContent({
            title: "INJECTION SUCCESSFUL",
            body: (
                <div style={{textAlign:'center'}}>
                    <p>Code successfully hidden in image matrix.</p>
                    <a 
                        href={canvas.toDataURL()} 
                        download="hacked_image.png"
                        className="robo-btn"
                        style={{display:'inline-block', fontSize:'0.8rem', padding:'10px'}}
                    >
                        DOWNLOAD PAYLOAD
                    </a>
                </div>
            )
        });
        setModalOpen(true);
    };

    // 3. DECODE (REMOVE HACK)
    const handleRestore = () => {
        if (!imageLoaded) return alert("SYSTEM ERROR: No Image");

        const ctx = canvasRef.current.getContext('2d');
        const data = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height).data;

        let binary = "";
        let decodedText = "";

        // Read LSB
        for (let i = 0; i < data.length; i += 4) {
            binary += (data[i + 2] % 2);
        }

        // Convert back to text
        for (let i = 0; i < binary.length; i += 8) {
            const byte = binary.slice(i, i + 8);
            if (byte === "00000000") break;
            decodedText += String.fromCharCode(parseInt(byte, 2));
        }

        // Open Result Modal
        setModalContent({
            title: "DATA EXTRACTED",
            body: (
                <div>
                    <p style={{color:'gray'}}>Decrypted Message:</p>
                    <div style={{
                        border:'1px solid lime', 
                        padding:'10px', 
                        color:'lime', 
                        background:'black',
                        fontSize:'1.2rem'
                    }}>
                        {decodedText}
                    </div>
                </div>
            )
        });
        setModalOpen(true);
    };

    // --- RENDER ---
    return (
        <div className="container">
            {/* SCREEN 1: HOME */}
            {screen === 'home' && (
                <div className="home-screen">
                    <h1 className="title-glitch">STEGA_VAULT v2.0</h1>
                    <div style={{display:'flex', gap:'20px'}}>
                        <button className="robo-btn" onClick={() => setScreen('encode')}>
                            HACK THIS
                        </button>
                        <button className="robo-btn danger" onClick={() => setScreen('decode')}>
                            REMOVE HACK
                        </button>
                    </div>
                </div>
            )}

            {/* SCREEN 2: ENCODE WORKSPACE */}
            {screen === 'encode' && (
                <div className="workspace">
                    <button className="back-btn" onClick={goHome}>[ TERMINATE ]</button>
                    <h2>// INITIATE HACKING SEQUENCE</h2>
                    
                    <p>1. UPLOAD TARGET IMAGE</p>
                    <input type="file" onChange={handleImageUpload} accept="image/*" />
                    
                    <p>2. ENTER MALICIOUS CODE (MESSAGE)</p>
                    <textarea 
                        rows="4" 
                        placeholder="Type secret data here..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    ></textarea>

                    <button className="robo-btn" onClick={handleHack} style={{width:'100%', marginTop:'20px'}}>
                        EXECUTE INJECTION
                    </button>
                </div>
            )}

            {/* SCREEN 3: DECODE WORKSPACE */}
            {screen === 'decode' && (
                <div className="workspace" style={{borderColor:'var(--secondary)'}}>
                    <button className="back-btn" onClick={goHome}>[ TERMINATE ]</button>
                    <h2 style={{color:'var(--secondary)'}}>// SYSTEM RECOVERY</h2>
                    
                    <p>1. UPLOAD COMPROMISED IMAGE</p>
                    <input type="file" onChange={handleImageUpload} accept="image/*" />

                    <button className="robo-btn danger" onClick={handleRestore} style={{width:'100%', marginTop:'20px'}}>
                        SCAN & EXTRACT
                    </button>
                </div>
            )}

            {/* HIDDEN CANVAS ENGINE */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* POPUP WINDOW MODAL */}
            {modalOpen && (
                <div className="modal-overlay">
                    <div className="modal-window">
                        <div className="modal-header">
                            <span>{modalContent.title}</span>
                            <span className="close-x" onClick={() => setModalOpen(false)}>X</span>
                        </div>
                        <div className="modal-body">
                            {modalContent.body}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
