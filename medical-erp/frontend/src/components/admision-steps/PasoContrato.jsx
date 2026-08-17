import { Send, CheckCircle, FileText, Shield, Tablet, Clock, Eye, Loader } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { membresiaService } from '../../services/membresiaService';
import { contratoPwaService } from '../../services/contratoPwaService';

const POLL_INTERVAL = 3000;

const CONTRATO_TEXTO = `# Optimal Health NOW
## A Private Membership Association

# MEMBERSHIP CONTRACT

I, ______________________________________, for membership fee paid in hand, do hereby apply for membership in Optimal Health NOW, a private membership organization.

With the signing of this membership agreement, I/we accept the offer made to become a member of Optimal Health NOW and have read and agree with the following Declaration of Purpose from Article I of Optimal Health NOW's Articles of Association.

---

## 1. Declaration of Purpose

This Association of members hereby declares that our main objective is to maintain and improve the civil rights, constitutional guarantees, and political freedom of every member and citizen of the United States of America.

We believe and affirm that the Constitution of the United States is one of the best documents ever devised by man, and the signers of the Declaration of Independence did so out of love for their country.

## 2. Freedom of Association

We believe that the First Amendment of the Constitution of the United States of America guarantees our members the rights of free speech, petition, assembly, right to contract, and the right to gather together for the lawful purpose of advising and helping one another in asserting our rights under the federal and state constitutions and statutes.

We strive to maintain and improve the civil rights, constitutional guarantees, freedom of choice in health care and political freedom of every member of this Association.

**IT IS HEREBY Declared** that we are exercising our right of "freedom of association" as guaranteed by the First and Fourteenth Amendments of the U.S. Constitution and equivalent provisions of the various state constitutions.

This means that our Association activities are restricted to the private domain only.

## 3. Selection of Members and Counsel

We declare the basic right of all our members to select spokesmen from our number who could be expected to give wisest counsel and advice concerning the need for physical and mental health care assistance and to select from our number those members who are the most skilled to assist and facilitate the actual performance and delivery of care.

## 4. Freedom to Choose Therapies

We proclaim the freedom to choose and perform for ourselves the types of therapies and modalities that we think best for assessing and preventing illness of our minds and bodies and for achieving and maintaining optimum wellness.

We proclaim and reserve the right to include health options that include, but are not limited to, cutting edge modalities and therapies practiced or used by any types of healers or therapists or practitioners the world over, whether traditional or nontraditional, conventional or unconventional.

## 5. Mission and Services

The mission of our Association is to provide members with the highest level of quality care and the most effective methods available.

We emphasize our member's health condition, and not merely the symptoms experienced.

Our Association understands that wellness has many dimensions and strives every day to stay on the leading edge of new technology.

The Association provides comprehensive, conventional, complementary, alternative care and advanced technologies for all aspects of a member's health and provides the most effective means of care at an affordable fee.

More specifically, our Association provides members with the following:

- Blood infiltration with regenerative Advanced Stem Cells for the entire body including ligaments / knees
- Carpal tunnel syndrome
- Achilles heel
- Regeneration and proliferation of absent cartilage
- Platelet Rich Plasma Treatments (PRP)
- Neural Blood Therapies (to remove pain & inflammation immediately)
- Autohemotherapy (blood therapy to stimulate the immune system)
- Cellular Oxygenation
- Cellular Activator Ampoules
- Transfer Factor Ampoules
- Epigenetics Supplementation
- Corticosteroids
- Ancestral Formulas
- Complementary and Alternative IV Therapies
- Treatments for Autoimmune Diseases

Other health and aesthetic services and products offered for the benefit of members are:

### Health

- Quantum Magnetic Resonance
- Naturism and Human Health
- Complementary and Alternative Medicine
- Anti-Aging Therapies
- Natural Treatments & Alternative Therapies
- Ortho Molecular Treatments through Organic Foods and Cellular Food Supplementation
- Farmacotecnia through Homeopathy
- Nutrition at a Cellular & Immune System level in conjunction with Supplementation and Vitaminization
- Nutrition with Phytonutrients and Homeopathic Antioxidants through Natural Formulas
- Family Guidance and Planning through Breast-Feeding
- Physical Therapy and Rehabilitation
- Insertion of Testosterone Pellets (Bio-Identical)
- Auriculotherapy-Noack System (Special Points and Areas)
- Therapies for Weight Loss and Eating Disorders
- Personalized Weight loss Programs through Genetic Testing based on the Obesity of each member
- Genetic and Genomic Medicine: Complementary/Natural/Alternative/Homeopathy

### Aesthetic

- Massage Therapy and Cosmeatria through Physical Rehabilitation
- Meso Face and Body Treatments
- Advanced Integral Aesthetics
- Facial and Body Lifting
- BIOTHREAD Facial Treatments
- Anti Aging Rejuvenation (PRP)
- Hidrolipocanula Treatments
- Sclerotherapy Treatments
- Ultraviolet Peeling Treatments

As alternates and for the benefit of its members.

## 6. Membership

The Association will recognize any person (irrespective of race, color, or religion) who is in agreement with these principles and policies as a member and will provide a medium through which its individual members may associate for actuating and bringing to fruition the principles and purposes heretofore declared.

---

# MEMORANDUM OF UNDERSTANDING

I understand that the fellow members of the Association that provide services and care, do so in the capacity of a fellow member and not in the capacity as a licensed health care provider.

I further understand that within the association no doctor-patient relationship exists but only a contract member-member Association relationship.

In addition, I have freely chosen to change my legal status as a public patient or client to a private member of the Association.

I further understand that it is entirely my own responsibility to consider the advice and recommendations offered to me by my fellow members and to educate myself as to the efficacy, risks, and desirability of same and the acceptance of the offered or recommended assessment, diagnosis, therapy, treatment and care is my own carefully considered decision.

Any request by me to a fellow member to assist me or provide me with the aforementioned assessment, diagnosis, therapy, treatment and care is my own free decision in an exercise of my rights and made by me for my benefit.

I agree to hold the Trustee(s), staff and other worker members and the Association harmless from any unintentional liability for the results of such care, except for harm that results from instances of a clear and present danger of substantive evil as determined by the Association, as stated and defined by the United States Supreme Court.

---

The Trustees and members have chosen Carlos Martos and Nora Carolina Martos as the persons best qualified to perform services to members of the Association and entrust them to select other members to assist them in carrying out that service.

In addition, I understand that since the Association is protected by the First and Fourteenth Amendments to the U.S. Constitution, it is outside the jurisdiction and authority of Federal and State Agencies and Authorities concerning any and all complaints or grievances against the Association, any Trustee(s), members or other staff persons.

All rights of complaints or grievances will be settled by an Association Committee and will be waived by the member for the benefit of the Association and its members.

Because the privacy and security of membership records maintained within the Association which have been held to be inviolate by the U.S. Supreme Court, the undersigned member waives HIPAA privacy rights and complaint process.

Any medical or healthcare records kept by the association will be strictly protected and only released upon written request of the member.

I agree that violation of any waivers in this membership contract will result in a no contest legal proceeding against me.

In addition, the Association does not participate in any medical insurance plans or collections on behalf of the member but will provide a suitable invoice for the member to pursue reimbursement by his/her insurance company, if applicable.

I agree to join the Association, a private membership association under common law, whose members seek to help each other achieve better health and live longer with good quality of life.

I understand that the doctors, nurses, and other providers who are fellow members of the Association are offering me advice, services, and benefits that do not necessarily conform to conventional medical care.

I do not expect these benefits to include on-call coverage, hospital care, or the usual and customary care provided by most physicians.

I will receive such primary and specialist care elsewhere.

I fully understand that the benefits I receive from the Association might or might not be covered by my health insurance and not at all by Medicare.

As a member, I accept the goals of helping my body function better and choosing techniques that are both very safe and have a reasonably good chance to succeed, realizing that no diagnostic technique or treatment is foolproof.

If I choose to forgo drugs, surgery, or radiation that has been recommended to me by others, I fully accept the risk that I might suffer serious consequences from that choice.

Other aspects of informed consent will take place in my discussions with the providers and my fellow members.

My activities within the Association are a private matter that I refuse to share with the State Medical Board, the FDA, FTC, Medicare, Medicaid or my own insurance company without my expressed specific permission.

All records and documents remain as property of the Association, even if I receive a copy of them.

I fully agree not to file a malpractice lawsuit against a fellow member of the Association unless that member has exposed me to a clear and present danger of substantive evil.

I acknowledge that the members of the Association do not carry malpractice insurance.

I enter into this agreement of my own free will or on behalf of my dependent without any pressure or promise of cure.

I affirm that I do not represent any State or Federal agency whose purpose is to regulate and approve products.

I have read and understood this document, and my questions have been answered fully to my satisfaction.

I understand that I can withdraw from this agreement and terminate my membership in this association at any time.

These pages and Article I of the Articles of Association of the Association consist of the entire agreement for my membership in the Association and they supersede any previous agreement.

I understand that the membership fee entitles me to receive those benefits declared by the Trustee(s) to be "general benefits" free of further charge.

I agree to pay as levied those benefits that I receive that are declared by the Trustees to be "special assessments", per Fee Schedule.

I enclose the sum of **$10.00** as consideration for my one-time lifetime membership contract, said term beginning with the date of the signing of this contract.

By these presents do hereby certify, attest and warrant that I have carefully read the above and foregoing Optimal Health NOW's Contractual Application for Membership and I fully understand and agree with same.

---

# SIGNATURES

**IN WITNESS WHEREOF** I set my hand this ______ day of _____________________, 20____.

### Member Information

**Member's Name:**

**Member's Signature:**
____________________________________________

**Member's Contact Information:**

**Street:**

**City:**

**State:**

**Zip Code:**

**Home/Work/Cell Numbers:**

**Email Address:**

---

# APPROVAL AND ACCEPTANCE

Optimal Health NOW
A Private Membership Association

Approved and accepted this ____ day of _____________________, 20____.

**By:** Carlos Martos

**Date:** ____________________________________

**By:** Dr. Carolina Martos

**Date:** ____________________________________`;

export default function PasoContrato({ pacienteId, pacienteNombre, membresias, onMembresiasChange, contratoFirmado, onContratoFirmado }) {
  const [showContract, setShowContract] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [token, setToken] = useState('');
  const [polling, setPolling] = useState(false);
  const [consentimientoId, setConsentimientoId] = useState(null);
  const pollingRef = useRef(null);

  const yaTieneMembresia = membresias.length > 0;
  const membresiaActiva = membresias.find(m => m.estado === 'activa');

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleEnviarTablet = async () => {
    setSending(true);
    try {
      const data = await contratoPwaService.enviar(pacienteId, 'CONTRATO_MEMBRESIA');
      setToken(data.token);
      setPolling(true);

      // Start polling for status
      pollingRef.current = setInterval(async () => {
        try {
          const status = await contratoPwaService.getStatus(data.token);
          if (status.status === 'FIRMADO') {
            clearInterval(pollingRef.current);
            setPolling(false);
            setConsentimientoId(status.consentimientoId);
            onContratoFirmado(true, status.consentimientoId);
          }
        } catch {
          // ignore polling errors
        }
      }, POLL_INTERVAL);
    } catch {
      // handle error
    } finally {
      setSending(false);
    }
  };

  const handleVerPDF = () => {
    if (consentimientoId) {
      window.open(`/api/v1/consentimientos/${consentimientoId}/pdf`, '_blank');
    }
  };

  return (
    <div className="wizard-step">
      <div className="wizard-step__header">
        <FileText size={24} />
        <h3>Contrato de Membresia</h3>
        <p>Optimal Health NOW - Membresia de por vida</p>
      </div>

      {/* Estado de la membresia */}
      {yaTieneMembresia && membresiaActiva && (
        <div className="wizard-step__contrato-estado">
          <Shield size={20} />
          <div className="wizard-step__contrato-estado-info">
            <span className="wizard-step__contrato-estado-tipo">Membresia Vitalicia</span>
            <span className="wizard-step__contrato-estado-detalle">
              Inicio: {membresiaActiva.fechaInicio} · Costo: $10.00
            </span>
          </div>
          <CheckCircle size={18} className="wizard-step__contrato-estado-check" />
        </div>
      )}

      {/* Contrato */}
      {!showContract ? (
        <button className="wizard-step__btn-contrato" onClick={() => setShowContract(true)}>
          <FileText size={18} /> Ver contrato completo
        </button>
      ) : (
        <div className="wizard-step__contrato-doc">
          <div className="wizard-step__contrato-header">
            <span>Contrato de Membresia - Optimal Health NOW</span>
            <button className="wizard-step__btn-contrato-close" onClick={() => setShowContract(false)}>Cerrar</button>
          </div>
          <div className="wizard-step__contrato-body">
            {CONTRATO_TEXTO.split('\n').map((line, i) => (
              <p key={i}>{line || '\u00A0'}</p>
            ))}
          </div>
        </div>
      )}

      {/* Firma via Tablet Kiosco */}
      <div className="wizard-step__contrato-firma">
        {!contratoFirmado && !polling && (
          <div className="wizard-step__contrato-firma-pendiente">
            <p>
              <Tablet size={16} /> Enviar el contrato a la tablet para que el paciente lo firme en el kiosco.
            </p>
            <button className="wizard-step__btn-firma" onClick={handleEnviarTablet} disabled={sending}>
              <Tablet size={18} /> {sending ? 'Enviando...' : 'Enviar a tablet para firma'}
            </button>
          </div>
        )}

        {polling && (
          <div className="wizard-step__contrato-firma-pendiente">
            <p>
              <Loader size={16} className="wizard-step__spin" /> Contrato enviado. Esperando firma del paciente en la tablet...
            </p>
            <div className="wizard-step__firma-waiting">
              <div className="wizard-step__firma-waiting-dot" />
              <div className="wizard-step__firma-waiting-dot" />
              <div className="wizard-step__firma-waiting-dot" />
            </div>
          </div>
        )}

        {contratoFirmado && (
          <div className="wizard-step__contrato-firma-enviado">
            <CheckCircle size={20} className="wizard-step__firma-check" />
            <span>Contrato firmado exitosamente</span>
            {consentimientoId && (
              <button className="wizard-step__btn-pdf" onClick={handleVerPDF}>
                <Eye size={16} /> Ver PDF firmado
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
