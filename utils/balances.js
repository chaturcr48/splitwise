import { round2 } from './money';

export function getPerson(people, id) {
  return people.find((person) => person.id === id) || { id, name: 'Unknown', email: '', color: '#9AA6B2' };
}

export function getGroup(groups, id) {
  return groups.find((group) => group.id === id);
}

export function getGroupMembers(group, people) {
  if (!group) return [];
  return group.memberIds.map((id) => getPerson(people, id));
}

export function calculateBalances(people, expenses, settlements, groupId = null) {
  const balances = Object.fromEntries(people.map((person) => [person.id, 0]));

  expenses
    .filter((expense) => !groupId || expense.groupId === groupId)
    .forEach((expense) => {
      balances[expense.paidBy] = (balances[expense.paidBy] || 0) + expense.amount;
      Object.entries(expense.shares).forEach(([personId, share]) => {
        balances[personId] = (balances[personId] || 0) - share;
      });
    });

  settlements
    .filter((settlement) => !groupId || settlement.groupId === groupId)
    .forEach((settlement) => {
      balances[settlement.from] = (balances[settlement.from] || 0) + settlement.amount;
      balances[settlement.to] = (balances[settlement.to] || 0) - settlement.amount;
    });

  return Object.fromEntries(Object.entries(balances).map(([id, value]) => [id, round2(value)]));
}

export function simplifyDebts(balances, people) {
  const creditors = Object.entries(balances)
    .filter(([, value]) => value > 0.01)
    .map(([id, amount]) => ({ person: getPerson(people, id), amount }))
    .sort((a, b) => b.amount - a.amount);
  const debtors = Object.entries(balances)
    .filter(([, value]) => value < -0.01)
    .map(([id, amount]) => ({ person: getPerson(people, id), amount: Math.abs(amount) }))
    .sort((a, b) => b.amount - a.amount);

  const payments = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const amount = round2(Math.min(debtors[debtorIndex].amount, creditors[creditorIndex].amount));
    if (amount > 0.01) {
      payments.push({
        id: `${debtors[debtorIndex].person.id}-${creditors[creditorIndex].person.id}-${amount}`,
        from: debtors[debtorIndex].person,
        to: creditors[creditorIndex].person,
        amount,
      });
    }
    debtors[debtorIndex].amount = round2(debtors[debtorIndex].amount - amount);
    creditors[creditorIndex].amount = round2(creditors[creditorIndex].amount - amount);
    if (debtors[debtorIndex].amount <= 0.01) debtorIndex += 1;
    if (creditors[creditorIndex].amount <= 0.01) creditorIndex += 1;
  }

  return payments;
}

export function splitAmount(amount, memberIds, splitType, customValues) {
  if (splitType === 'exact') {
    const shares = Object.fromEntries(memberIds.map((id) => [id, round2(customValues[id])]));
    const total = round2(Object.values(shares).reduce((sum, value) => sum + value, 0));
    return { shares, total, valid: Math.abs(total - amount) <= 0.01 };
  }

  if (splitType === 'percent') {
    const percentages = Object.fromEntries(memberIds.map((id) => [id, round2(customValues[id])]));
    const totalPercent = round2(Object.values(percentages).reduce((sum, value) => sum + value, 0));
    const shares = Object.fromEntries(memberIds.map((id) => [id, round2((amount * percentages[id]) / 100)]));
    return { shares, total: totalPercent, valid: Math.abs(totalPercent - 100) <= 0.01 };
  }

  const base = memberIds.length ? round2(amount / memberIds.length) : 0;
  const shares = Object.fromEntries(memberIds.map((id) => [id, base]));
  const drift = round2(amount - Object.values(shares).reduce((sum, value) => sum + value, 0));
  if (memberIds[0]) shares[memberIds[0]] = round2(shares[memberIds[0]] + drift);
  return { shares, total: amount, valid: memberIds.length > 0 };
}
