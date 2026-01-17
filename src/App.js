const { useState, useRef } = React;

const App = () => {
    const [screen, setScreen] = useState('home'); 
    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null); 
    
    const [message, setMessage] = useState("");
    const [imageLoaded, setImageLoaded] = useState(false);
    const canvasRef = useRef(null);

    const goHome = () => {
        setScreen('home');
        setImageLoaded(false);
        setMessage("");
        setModalOpen(false);
    };

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

    // --- ENCRYPTION LOGIC ---
    const handleHack = () => {
        if (!imageLoaded || !message) return alert("SYSTEM ERROR: Missing Input");

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        let binary = "";
        for (let i = 0; i < message.length; i++) {
            binary += message.charCodeAt(i).toString(2).padStart(8, '0');
        }
        binary += "00000000"; 

        if (binary.length > data.length / 4) return alert("OVERFLOW: Text too long");

        for (let i = 0; i < binary.length; i++) {
            const pixelIndex = i * 4;
            const blue = data[pixelIndex + 2];
            const bit = parseInt(binary[i]);
            if (blue % 2 === 0 && bit === 1) data[pixelIndex + 2] += 1;
            else if (blue % 2 === 1 && bit === 0) data[pixelIndex + 2] -= 1;
        }

        ctx.putImageData(imgData, 0, 0);

        setModalContent({
            title: "INJECTION COMPLETE",
            body: (
                <div style={{textAlign:'center'}}>
                    <p>Payload successfully embedded in image matrix.</p>
                    <a 
                        href={canvas.toDataURL()} 
                        download="hacked_image.png"
                        className="robo-btn"
                        style={{marginTop: '15px'}}
                    >
                        DOWNLOAD ARTIFACT
                    </a>
                </div>
            )
        });
        setModalOpen(true);
    };

    // --- DECRYPTION LOGIC ---
    const handleRestore = () => {
        if (!imageLoaded) return alert("SYSTEM ERROR: No Image");
        const ctx = canvasRef.current.getContext('2d');
        const data = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height).data;
        let binary = "";
        let decodedText = "";

        for (let i = 0; i < data.length; i += 4) {
            binary += (data[i + 2] % 2);
        }

        for (let i = 0; i < binary.length; i += 8) {
            const byte = binary.slice(i, i + 8);
            if (byte === "00000000") break;
            decodedText += String.fromCharCode(parseInt(byte, 2));
        }

        setModalContent({
            title: "DATA RETRIEVED",
            body: (
                <div>
                    <p style={{color:'gray'}}>Decrypted Payload:</p>
                    <div style={{
                        border:'1px solid lime', 
                        padding:'10px', 
                        color:'lime', 
                        background:'black',
                        fontSize:'1.1rem',
                        wordBreak: 'break-all',
                        fontFamily: 'Courier New'
                    }}>
                        {decodedText}
                    </div>
                </div>
            )
        });
        setModalOpen(true);
    };

    return (
        <div className="container">
            {/* SCREEN 1: HOME */}
            {screen === 'home' && (
                <div className="home-screen">
                    <h1 className="title-glitch">STEGA_VAULT v3.0</h1>
                    <div className="button-group">
                        {/* UPDATED BUTTON NAMES */}
                        <button className="robo-btn" onClick={() => setScreen('encode')}>
                            INJECT PAYLOAD
                        </button>
                        <button className="robo-btn danger" onClick={() => setScreen('decode')}>
                            EXTRACT DATA
                        </button>
                    </div>
                </div>
            )}

            {/* SCREEN 2: INJECT WORKSPACE */}
            {screen === 'encode' && (
                <div className="workspace">
                    <button className="back-btn" onClick={goHome}>&lt; ABORT MISSION</button>
                    <h2>// INITIALIZE INJECTION</h2>
                    
                    <p>1. UPLOAD HOST IMAGE</p>
                    <input type="file" onChange={handleImageUpload} accept="image/*" />
                    
                    <p>2. ENTER SECRET PAYLOAD</p>
                    <textarea 
                        rows="4" 
                        placeholder="Type classified data..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    ></textarea>

                    <button className="robo-btn" onClick={handleHack} style={{width:'100%', marginTop:'20px'}}>
                        EXECUTE PROTOCOL
                    </button>
                </div>
            )}

            {/* SCREEN 3: EXTRACT WORKSPACE */}
            {screen === 'decode' && (
                <div className="workspace" style={{borderColor:'var(--secondary)'}}>
                    <button className="back-btn" onClick={goHome}>&lt; ABORT MISSION</button>
                    <h2 style={{color:'var(--secondary)'}}>// DATA EXTRACTION</h2>
                    
                    <p>1. UPLOAD ARTIFACT</p>
                    <input type="file" onChange={handleImageUpload} accept="image/*" />

                    <button className="robo-btn danger" onClick={handleRestore} style={{width:'100%', marginTop:'20px'}}>
                        ANALYZE & DECRYPT
                    </button>
                </div>
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* MODAL */}
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
