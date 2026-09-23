// Structured feedback, without a backend.
//
// The form collects the same fields as the GitHub issue template, then opens a
// prefilled issue. Nothing is sent anywhere until the person presses the button,
// and MidBid never collects anything about them in the background.
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, MessageSquare, X } from 'lucide-react';
import { EASE, Label } from './primitives';

const REPO = 'https://github.com/JayCul/midbid';

const TASKS = [
  'Connecting a wallet',
  'Getting ready (tNIGHT, DUST, proof server)',
  'Browsing auctions',
  'Creating an auction',
  'Placing a bid',
  'Claiming a win or settling',
  'Joining the pilot register',
  'Reading the site or the docs',
  'Something else',
];

const CLARITY = [
  '5 - completely clear',
  '4 - mostly clear',
  '3 - unsure',
  '2 - mostly unclear',
  '1 - not clear at all',
];

/** Builds the prefilled issue URL. Issue form fields are filled by their id. */
export function feedbackUrl(fields: {
  task: string;
  whatHappened: string;
  expected: string;
  clarity: string;
}) {
  const params = new URLSearchParams({
    template: 'feedback.yml',
    labels: 'feedback,pilot',
    task: fields.task,
    'what-happened': fields.whatHappened,
    expected: fields.expected,
    clarity: fields.clarity,
  });
  return `${REPO}/issues/new?${params.toString()}`;
}

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState(TASKS[4]);
  const [whatHappened, setWhatHappened] = useState('');
  const [expected, setExpected] = useState('');
  const [clarity, setClarity] = useState(CLARITY[1]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex h-11 items-center gap-2 rounded-full border border-white/16 bg-abyss/90 px-4 text-[13px] backdrop-blur transition-colors hover:border-white/48"
      >
        <MessageSquare size={14} className="text-ember" aria-hidden /> Feedback
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              className="absolute inset-0 bg-void/70 backdrop-blur-md"
              aria-label="Close feedback"
              onClick={() => setOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="feedback-title"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="relative w-full max-w-[520px] border border-white/8 bg-abyss p-7 sm:rounded-2xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <Label tone="ember">Pilot feedback</Label>
                  <h2
                    id="feedback-title"
                    className="mt-4 text-[26px] leading-none tracking-[-0.04em]"
                  >
                    What happened?
                  </h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/8 text-white/48 hover:text-white"
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="mt-7 space-y-5">
                <div>
                  <label htmlFor="fb-task" className="label">
                    What were you doing
                  </label>
                  <select
                    id="fb-task"
                    className="field mt-2 text-[15px]"
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                  >
                    {TASKS.map((t) => (
                      <option key={t} value={t} className="bg-abyss">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="fb-what" className="label">
                    What happened
                  </label>
                  <textarea
                    id="fb-what"
                    rows={3}
                    className="field mt-2 resize-none text-[15px]"
                    value={whatHappened}
                    onChange={(e) => setWhatHappened(e.target.value)}
                    placeholder="What you did, and what the app did back."
                  />
                </div>
                <div>
                  <label htmlFor="fb-expected" className="label">
                    What you expected instead
                  </label>
                  <textarea
                    id="fb-expected"
                    rows={2}
                    className="field mt-2 resize-none text-[15px]"
                    value={expected}
                    onChange={(e) => setExpected(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="fb-clarity" className="label">
                    How clear was it that your bid stays private
                  </label>
                  <select
                    id="fb-clarity"
                    className="field mt-2 text-[15px]"
                    value={clarity}
                    onChange={(e) => setClarity(e.target.value)}
                  >
                    {CLARITY.map((c) => (
                      <option key={c} value={c} className="bg-abyss">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <a
                  href={feedbackUrl({ task, whatHappened, expected, clarity })}
                  target="_blank"
                  rel="noreferrer"
                  className={`btn-primary w-full ${whatHappened.trim() ? '' : 'pointer-events-none opacity-40'}`}
                  onClick={() => setTimeout(() => setOpen(false), 200)}
                >
                  Open a prefilled issue <ArrowUpRight size={15} aria-hidden />
                </a>
                <p className="text-[13px] leading-relaxed text-white/48">
                  This opens GitHub with your answers filled in. You press submit, so nothing leaves
                  this page until you do. Never include a recovery phrase.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
