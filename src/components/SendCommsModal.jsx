
import React, { useState } from 'react';

const SMS_TEMPLATES = [
    {
        sid: "33410",
        name: "p0 app download Hindi",
        content: "Hi {#name#}, aapka abroad job interest update kar rahe hain. Kovon safe & free platform hai. Profile banane ke liye download kare: {#applink#} -Kovon",
        variables: ["name", "applink"]
    },
    {
        sid: "33387",
        name: "App Open",
        content: "Jobs available for {#jobrole#} in {#country#}. Open your Kovon app and apply today. No charges. Login now: {#applink#} -Kovon",
        variables: ["jobrole", "country", "applink"]
    },
    {
        sid: "33386",
        name: "PO APP DOWNLOAD",
        content: "Hi {#name#}, aapka abroad job interest update kar rahe hain. Kovon safe & free platform hai. Profile banane ke liye download kare: https://vil.ltd/kovon/c/kjobs -Kovon",
        variables: ["name"]
    },
    {
        sid: "33385",
        name: "Context + Trust + App Install",
        content: "Hi {#name#}, this is regarding {#jobrole#} jobs in {#country#} . Kovon is 100% free with verified overseas employers. Download the app to explore safely. {#applink#} -Kovon",
        variables: ["name", "jobrole", "country", "applink"]
    },
    {
        sid: "33205",
        name: "DO Job Search",
        content: "Hi {#name#}, Kovon ne aapke skill ke hisaab se abroad jobs shortlist ki hain. Check karo aur free me apply karo: https://www.kovon.io/ -Kovon",
        variables: ["name"]
    }
];

const WHATSAPP_TEMPLATES = [
    {
        wid: "23781",
        name: "explain_next_step_profile_comp",
        content: "Dear {{1}}, You are now registered on Kovon. To see matching overseas jobs, please add your job role and target country. Takes less than 2 minutes.",
        variables: [{ key: "1", field: "name" }]
    },
    {
        wid: "23780",
        name: "unreg_day0_install_msg_media",
        content: "Hi {{1}} , main aapse {{2}} mein {{3}} ke jobs liye baat karna chah rahi thi. - Kovon par *0* charges - Koi agent nahi - Sirf *verified foreign jobs* hain Yahan se app download karein. Install ke baad DONE reply karein",
        variables: [{ key: "1", field: "name" }, { key: "2", field: "country" }, { key: "3", field: "jobrole" }]
    },
    {
        wid: "23506",
        name: "reg_noapply_day0",
        content: "Aapki profile {{1}} mein {{2}} jobs ke liye ready hai. Live jobs available hain. App kholkar search karein. Main madad kar sakti hoon.",
        variables: [{ key: "1", field: "country" }, { key: "2", field: "jobrole" }]
    },
    {
        wid: "23503",
        name: "unreg_fomo_day4",
        content: "Aap jaise profile wale candidates ne {{1}} mein {{2}} jobs ke liye Kovon par apply kiya hai. Aap bhi bina paisa diye apply kar sakte hain. 🎊 Abhi install karein, aur future secure karein!🌏",
        variables: [{ key: "1", field: "country" }, { key: "2", field: "jobrole" }]
    },
    {
        wid: "23502",
        name: "unreg_day0_install_msg",
        content: "Hi {{1}} , main aapse {{2}} mein {{3}} ke jobs liye baat karna chah rahi thi. - Kovon par *0* charges - Koi agent nahi - Sirf *verified foreign jobs* hain Yahan se app download karein. Install ke baad DONE reply karein",
        variables: [{ key: "1", field: "name" }, { key: "2", field: "country" }, { key: "3", field: "jobrole" }]
    }
];

const getVariableValue = (key, record) => {
    switch (key) {
        case 'name':
            return record.fullName || '';
        case 'country':
            return typeof record.targetCountry === 'object' ? record.targetCountry.name : (record.targetCountry || '');
        case 'jobrole':
            return typeof record.targetJobRole === 'object' ? record.targetJobRole.name : (record.targetJobRole || '');
        case 'salary':
            if (record.jobSnapshot?.salary?.min) {
                return `${record.jobSnapshot.salary.min} ${record.jobSnapshot.salary.currency || ''}`;
            }
            return 'competitive';
        case 'applink':
            return 'https://vil.ltd/kovon/c/kjobs';
        default:
            return '';
    }
};

const SendCommsModal = ({ onClose, users, cohortName }) => {
    const [commsType, setCommsType] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [sid, setSid] = useState('');
    const [wid, setWid] = useState('');
    const [variables, setVariables] = useState([{ key: '', value: '' }]);
    const [isSending, setIsSending] = useState(false);
    const [sentCount, setSentCount] = useState(0);
    const [failedCount, setFailedCount] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleTemplateChange = (e) => {
        const templateName = e.target.value;
        setSelectedTemplate(templateName);

        if (commsType === 'SMS') {
            const template = SMS_TEMPLATES.find(t => t.name === templateName);
            if (template) {
                setSid(template.sid);
                const newVariables = template.variables.map(key => ({
                    key,
                    value: ''
                }));
                setVariables(newVariables);
            } else {
                setSid('');
                setVariables([{ key: '', value: '' }]);
            }
        } else if (commsType === 'Whatsapp') {
            const template = WHATSAPP_TEMPLATES.find(t => t.name === templateName);
            if (template) {
                setWid(template.wid);
                const newVariables = template.variables.map(v => ({
                    key: v.key,
                    value: ''
                }));
                setVariables(newVariables);
            } else {
                setWid('');
                setVariables([{ key: '', value: '' }]);
            }
        }
    };

    const handleAddVariable = () => {
        setVariables(prev => [...prev, { key: '', value: '' }]);
    };

    const handleVariableChange = (index, field, value) => {
        setVariables(prev => {
            const newVars = [...prev];
            newVars[index][field] = value;
            return newVars;
        });
    };

    const handleDeleteVariable = (index) => {
        setVariables(prev => prev.filter((_, i) => i !== index));
    };

    const parsePhone = (phone) => {
        if (!phone) return null;
        let mobile = phone.replace(/\D/g, '');
        if (mobile.startsWith('91') && mobile.length > 10) {
            mobile = mobile.slice(2);
        }
        return mobile;
    };

const sendSMS = async (mobile, sid, vars, user) => {
        const url = new URL('https://api.authkey.io/request');
        url.searchParams.append('authkey', 'b0d73e4663db5196');
        url.searchParams.append('mobile', mobile);
        url.searchParams.append('country_code', '91');
        url.searchParams.append('sid', sid);

        vars.forEach(({ key, value }) => {
            const finalValue = value || getVariableValue(key, user);
            if (key && finalValue) url.searchParams.append(key, finalValue);
        });

        const response = await fetch(url.toString(), {
            method: 'POST'
        });
        return response.json();
    };

    const sendWhatsApp = async (mobile, wid, vars, user) => {
        const bodyValues = {};
        vars.forEach(({ key, value }) => {
            const finalValue = value || getVariableValue(key, user);
            if (key && finalValue) {
                bodyValues[key] = finalValue;
            }
        });

        const response = await fetch('https://console.authkey.io/restapi/requestjson.php', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic b0d73e4663db5196',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                country_code: "91",
                mobile,
                wid,
                type: "text",
                bodyValues
            })
        });
        return response.json();
    };

    const handleSend = async () => {
        if (!users || users.length === 0) {
            alert('No users to send comms to.');
            return;
        }

        setIsSending(true);
        setSentCount(0);
        setFailedCount(0);
        setCurrentIndex(0);

        let success = 0;
        let failed = 0;

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const phone = parsePhone(user.phoneNumber);
            
            if (!phone) {
                failed++;
                continue;
            }

            try {
                if (commsType === 'SMS') {
                    if (!sid) {
                        alert('SID is required.');
                        setIsSending(false);
                        return;
                    }
                    await sendSMS(phone, sid, variables, user);
                } else if (commsType === 'Whatsapp') {
                    if (!wid) {
                        alert('WID is required.');
                        setIsSending(false);
                        return;
                    }
                    await sendWhatsApp(phone, wid, variables, user);
                }
                success++;
            } catch (err) {
                console.error(`Failed to send to ${user.phoneNumber}:`, err);
                failed++;
            }
            
            setCurrentIndex(i + 1);
            setSentCount(success);
            setFailedCount(failed);
        }

        setIsSending(false);
        alert(`Comms sent! Success: ${success}, Failed: ${failed}`);
        onClose();
    };

    const getPreviewMessage = () => {
        let template = null;
        if (commsType === 'SMS') {
            template = SMS_TEMPLATES.find(t => t.name === selectedTemplate);
        } else if (commsType === 'Whatsapp') {
            template = WHATSAPP_TEMPLATES.find(t => t.name === selectedTemplate);
        }

        if (!template) return '';

        const previewUser = users[0] || {};
        let message = template.content;
        variables.forEach(({ key, value }) => {
            const finalValue = value || getVariableValue(key, previewUser);
            if (commsType === 'SMS') {
                message = message.split(`{#${key}#}`).join(finalValue || `{#${key}#}`);
            } else if (commsType === 'Whatsapp') {
                message = message.split(`{{${key}}}`).join(finalValue || `{{${key}}}`);
            }
        });
        return message;
    };

    const getValidPhoneCount = () => {
        return users.filter(u => parsePhone(u.phoneNumber)).length;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[80] flex justify-center items-center" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Send Comms - {cohortName}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>&times;</button>
                </div>

                <div style={{ marginBottom: 16, padding: '12px', background: '#f5f5f5', borderRadius: 4 }}>
                    <p style={{ margin: 0 }}><strong>Total Users:</strong> {users.length}</p>
                    <p style={{ margin: '4px 0 0 0' }}><strong>Valid Phone Numbers:</strong> {getValidPhoneCount()}</p>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Type of Comms</label>
                    <select
                        className="w-full p-2 border rounded"
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: 4 }}
                        value={commsType}
                        onChange={(e) => {
                            setCommsType(e.target.value);
                            setSelectedTemplate('');
                            setSid('');
                            setWid('');
                            setVariables([{ key: '', value: '' }]);
                        }}
                    >
                        <option value="">-- Select --</option>
                        <option value="SMS">SMS</option>
                        <option value="Whatsapp">Whatsapp</option>
                    </select>
                </div>

                {commsType === 'SMS' && (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                            <select
                                className="w-full p-2 border rounded"
                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: 4 }}
                                value={selectedTemplate}
                                onChange={handleTemplateChange}
                            >
                                <option value="">-- Select Template --</option>
                                {SMS_TEMPLATES.map(t => (
                                    <option key={t.sid} value={t.name}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">SID</label>
                            <input type="text" className="w-full p-2 border rounded bg-gray-100" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: 4, background: '#f5f5f5' }} value={sid} readOnly />
                        </div>
                    </>
                )}

                {commsType === 'Whatsapp' && (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                            <select
                                className="w-full p-2 border rounded"
                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: 4 }}
                                value={selectedTemplate}
                                onChange={handleTemplateChange}
                            >
                                <option value="">-- Select Template --</option>
                                {WHATSAPP_TEMPLATES.map(t => (
                                    <option key={t.wid} value={t.name}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">WID</label>
                            <input type="text" className="w-full p-2 border rounded bg-gray-100" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: 4, background: '#f5f5f5' }} value={wid} readOnly />
                        </div>
                    </>
                )}

                {commsType && (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Variables</label>
                            {variables.map((variable, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <input
                                        type="text"
                                        placeholder="Key"
                                        style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: 4 }}
                                        value={variable.key}
                                        onChange={(e) => handleVariableChange(index, 'key', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Value"
                                        style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: 4 }}
                                        value={variable.value}
                                        onChange={(e) => handleVariableChange(index, 'value', e.target.value)}
                                    />
                                    <button onClick={() => handleDeleteVariable(index)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', padding: '4px 8px' }}>✕</button>
                                </div>
                            ))}
                            <button onClick={handleAddVariable} style={{ color: '#0066cc', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'medium' }}>
                                + Add Variable
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Message Preview</label>
                            <div style={{ padding: '12px', background: '#f9f9f9', border: '1px solid #ddd', borderRadius: 4, fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                                {getPreviewMessage() || <span style={{ color: '#888', fontStyle: 'italic' }}>Select a template to see preview</span>}
                            </div>
                        </div>

                        {isSending && (
                            <div style={{ marginBottom: 16, padding: 12, background: '#e8f4fd', borderRadius: 4 }}>
                                <p style={{ margin: 0 }}>Sending... {currentIndex + 1} / {users.length}</p>
                                <p style={{ margin: '4px 0 0 0' }}>Success: {sentCount} | Failed: {failedCount}</p>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 24 }}>
                            <button onClick={onClose} style={{ padding: '8px 16px', background: '#e0e0e0', border: 'none', borderRadius: 4, cursor: 'pointer' }} disabled={isSending}>Cancel</button>
                            <button onClick={handleSend} style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: isSending ? 0.6 : 1 }} disabled={isSending || !selectedTemplate}>
                                {isSending ? 'Sending...' : `SEND TO ${getValidPhoneCount()} USERS`}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SendCommsModal;

