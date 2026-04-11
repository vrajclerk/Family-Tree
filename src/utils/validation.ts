import type { FamilyMemberWithPerson } from '../hooks/useFamilyMembers';

interface ValidationResult {
    error: string | null;
    warning: string | null;
}

const differenceInYears = (date1: Date, date2: Date) => {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
};

export const validateRelationship = (
    member1: FamilyMemberWithPerson | undefined,
    member2: FamilyMemberWithPerson | undefined,
    relationshipType: string
): ValidationResult => {
    let error: string | null = null;
    let warning: string | null = null;

    if (!member1 || !member2) return { error, warning };

    // Get dates if available
    const birth1 = member1.person?.birth_date ? new Date(member1.person.birth_date) : null;
    const birth2 = member2.person?.birth_date ? new Date(member2.person.birth_date) : null;

    // If we don't have both birth dates, we can't perform age-related validations
    if (!birth1 || !birth2) return { error, warning };

    const diffYears = differenceInYears(birth1, birth2);

    if (relationshipType === 'parent_child') {
        const isMember1Parent = true; // In parent_child relation, member1 is Parent, member2 is Child.
        // If parent born after child
        if (birth1 > birth2) {
            error = 'Impossible connection: Parent cannot be born after the child.';
        } else {
            // Parent is older than child, check the gap
            if (diffYears < 12) {
                warning = `Unlikely connection: Parent is only ${diffYears} years older than the child.`;
            } else if (diffYears > 80) {
                warning = `Unlikely connection: Parent is ${diffYears} years older than the child.`;
            }
        }
    } else if (relationshipType === 'spouse') {
        if (diffYears > 50) {
            warning = `Unlikely connection: The age gap between spouses is ${diffYears} years.`;
        }
    } else if (relationshipType === 'sibling') {
        if (diffYears > 40) {
            warning = `Unlikely connection: The age gap between siblings is ${diffYears} years.`;
        }
    }

    return { error, warning };
};
