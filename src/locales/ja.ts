import type { Message } from "@/lib/i18n";

import type { MessageKey } from "./en";
// 日本語。初回翻訳。
// The text is in src/locales/text/<prefix>.ts, beside the English.

import * as a11y from "./text/a11y";
import * as account from "./text/account";
import * as ach from "./text/ach";
import * as activity from "./text/activity";
import * as advice from "./text/advice";
import * as appearance from "./text/appearance";
import * as awards from "./text/awards";
import * as band from "./text/band";
import * as block from "./text/block";
import * as bmi from "./text/bmi";
import * as body from "./text/body";
import * as buddy from "./text/buddy";
import * as buy from "./text/buy";
import * as cal from "./text/cal";
import * as callText from "./text/callText";
import * as card from "./text/card";
import * as category from "./text/category";
import * as cause from "./text/cause";
import * as coach from "./text/coach";
import * as conn from "./text/conn";
import * as cos from "./text/cos";
import * as count from "./text/count";
import * as creator from "./text/creator";
import * as cycle from "./text/cycle";
import * as dash from "./text/dash";
import * as delight from "./text/delight";
import * as demo from "./text/demo";
import * as done from "./text/done";
import * as dots from "./text/dots";
import * as equipment from "./text/equipment";
import * as ex from "./text/ex";
import * as exp from "./text/exp";
import * as explain from "./text/explain";
import * as extra from "./text/extra";
import * as fb from "./text/fb";
import * as fit from "./text/fit";
import * as fix from "./text/fix";
import * as fmt from "./text/fmt";
import * as game from "./text/game";
import * as ghost from "./text/ghost";
import * as gl from "./text/gl";
import * as gloss from "./text/gloss";
import * as goal from "./text/goal";
import * as gym from "./text/gym";
import * as hr from "./text/hr";
import * as imp from "./text/imp";
import * as info from "./text/info";
import * as inj from "./text/inj";
import * as ins from "./text/ins";
import * as lab from "./text/lab";
import * as league from "./text/league";
import * as link from "./text/link";
import * as lvl from "./text/lvl";
import * as map from "./text/map";
import * as mom from "./text/mom";
import * as msg from "./text/msg";
import * as msgKind from "./text/msgKind";
import * as muscle from "./text/muscle";
import * as nav from "./text/nav";
import * as note from "./text/note";
import * as notes from "./text/notes";
import * as orm from "./text/orm";
import * as part from "./text/part";
import * as past from "./text/past";
import * as pgm from "./text/pgm";
import * as photos from "./text/photos";
import * as plate from "./text/plate";
import * as pm from "./text/pm";
import * as pol from "./text/pol";
import * as pr from "./text/pr";
import * as pro from "./text/pro";
import * as prog from "./text/prog";
import * as progress from "./text/progress";
import * as quest from "./text/quest";
import * as quote from "./text/quote";
import * as rarity from "./text/rarity";
import * as recap from "./text/recap";
import * as recovery from "./text/recovery";
import * as remix from "./text/remix";
import * as rmd from "./text/rmd";
import * as rt from "./text/rt";
import * as save from "./text/save";
import * as sband from "./text/sband";
import * as sea from "./text/sea";
import * as settings from "./text/settings";
import * as setup from "./text/setup";
import * as share from "./text/share";
import * as sig from "./text/sig";
import * as stats from "./text/stats";
import * as str from "./text/str";
import * as tab from "./text/tab";
import * as td from "./text/td";
import * as tdee from "./text/tdee";
import * as theme from "./text/theme";
import * as tier from "./text/tier";
import * as time from "./text/time";
import * as today from "./text/today";
import * as ton from "./text/ton";
import * as tools from "./text/tools";
import * as train from "./text/train";
import * as trn from "./text/trn";
import * as twin from "./text/twin";
import * as units from "./text/units";
import * as variety from "./text/variety";
import * as vc from "./text/vc";
import * as warm from "./text/warm";
import * as wdg from "./text/wdg";
import * as why from "./text/why";
import * as wk from "./text/wk";
import * as workout from "./text/workout";
import * as x from "./text/x";

export const ja: Partial<Record<MessageKey, Message>> = {
  ...a11y.ja,
  ...account.ja,
  ...ach.ja,
  ...activity.ja,
  ...advice.ja,
  ...appearance.ja,
  ...awards.ja,
  ...band.ja,
  ...block.ja,
  ...bmi.ja,
  ...body.ja,
  ...buddy.ja,
  ...buy.ja,
  ...cal.ja,
  ...card.ja,
  ...callText.ja,
  ...category.ja,
  ...cause.ja,
  ...coach.ja,
  ...conn.ja,
  ...cos.ja,
  ...count.ja,
  ...creator.ja,
  ...cycle.ja,
  ...dash.ja,
  ...delight.ja,
  ...demo.ja,
  ...done.ja,
  ...dots.ja,
  ...equipment.ja,
  ...ex.ja,
  ...exp.ja,
  ...explain.ja,
  ...extra.ja,
  ...fb.ja,
  ...fit.ja,
  ...fix.ja,
  ...fmt.ja,
  ...game.ja,
  ...ghost.ja,
  ...gl.ja,
  ...gloss.ja,
  ...goal.ja,
  ...gym.ja,
  ...hr.ja,
  ...imp.ja,
  ...info.ja,
  ...inj.ja,
  ...ins.ja,
  ...lab.ja,
  ...league.ja,
  ...link.ja,
  ...lvl.ja,
  ...map.ja,
  ...mom.ja,
  ...msg.ja,
  ...msgKind.ja,
  ...muscle.ja,
  ...nav.ja,
  ...note.ja,
  ...notes.ja,
  ...orm.ja,
  ...part.ja,
  ...past.ja,
  ...pgm.ja,
  ...photos.ja,
  ...plate.ja,
  ...pm.ja,
  ...pol.ja,
  ...pr.ja,
  ...pro.ja,
  ...prog.ja,
  ...progress.ja,
  ...quest.ja,
  ...quote.ja,
  ...rarity.ja,
  ...recap.ja,
  ...recovery.ja,
  ...remix.ja,
  ...rmd.ja,
  ...rt.ja,
  ...save.ja,
  ...sband.ja,
  ...sea.ja,
  ...settings.ja,
  ...setup.ja,
  ...share.ja,
  ...sig.ja,
  ...str.ja,
  ...stats.ja,
  ...tab.ja,
  ...td.ja,
  ...tdee.ja,
  ...theme.ja,
  ...tier.ja,
  ...time.ja,
  ...today.ja,
  ...ton.ja,
  ...tools.ja,
  ...train.ja,
  ...trn.ja,
  ...twin.ja,
  ...units.ja,
  ...variety.ja,
  ...vc.ja,
  ...warm.ja,
  ...wdg.ja,
  ...why.ja,
  ...wk.ja,
  ...workout.ja,
  ...x.ja,
};
